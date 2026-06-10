import { MediaAttachment, WsClientEvent, WsEvent } from "./types";

const BASE_URL_WS =
  process.env.EXPO_PUBLIC_CHAT_BACKEND?.replace(/\/$/, "")
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:") ?? "";
if (!process.env.EXPO_PUBLIC_CHAT_BACKEND) {
  console.warn(
    "[ChatWS] EXPO_PUBLIC_CHAT_BACKEND is missing; check project_plant/.env and restart Expo with -c",
  );
}
const PING_INTERVAL = 25000;
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 500;
const MAX_QUEUE_SIZE = 50;
const MAX_RECONNECT_ATTEMPTS = 10;
const GRACE_PERIOD_MS = 3000;

type EventHandler = (event: WsEvent) => void;
type StatusHandler = () => void;
type CloseHandler = (code: number, reason: string) => void;
type ReconnectHandler = (attempt: number, max: number) => void;

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectAttempts = 0;
  private shouldReconnect = false;
  private pendingMessages: WsClientEvent[] = [];

  private eventHandlers = new Set<EventHandler>();
  private connectHandlers = new Set<StatusHandler>();
  private disconnectHandlers = new Set<StatusHandler>();
  private reconnectHandler: ReconnectHandler | null = null;
  private fatalCloseHandler: CloseHandler | null = null;

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(token: string): void {
    this.token = token;
    this.shouldReconnect = true;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.reconnectAttempts = 0;
    this.createConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.stopStableTimer();
    this.stopPing();
    this.clearReconnect();
    this.pendingMessages = [];
    this.fatalCloseHandler = null;
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  sendGroupMessage(
    content: string,
    opts?: {
      ttl?: number;
      allow_read_receipt?: boolean;
      media?: MediaAttachment;
    },
  ): void {
    this.send({
      type: "group_message",
      content,
      ...(opts?.ttl !== undefined && { ttl: opts.ttl }),
      ...(opts?.allow_read_receipt !== undefined && {
        allow_read_receipt: opts.allow_read_receipt,
      }),
      ...(opts?.media && { media: opts.media }),
    });
  }

  sendDM(
    toUserId: string,
    content: string,
    opts?: {
      ttl?: number;
      allow_read_receipt?: boolean;
      media?: MediaAttachment;
    },
  ): void {
    this.send({
      type: "dm",
      to: toUserId,
      content,
      ...(opts?.ttl !== undefined && { ttl: opts.ttl }),
      ...(opts?.allow_read_receipt !== undefined && {
        allow_read_receipt: opts.allow_read_receipt,
      }),
      ...(opts?.media && { media: opts.media }),
    });
  }

  markRead(messageId: string): void {
    this.send({ type: "mark_read", message_id: messageId });
  }

  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onConnect(handler: StatusHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  onDisconnect(handler: StatusHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  onFatalClose(handler: CloseHandler): void {
    this.fatalCloseHandler = handler;
  }

  onReconnecting(handler: ReconnectHandler): void {
    this.reconnectHandler = handler;
  }

  getPendingCount(): number {
    return this.pendingMessages.length;
  }

  private createConnection(): void {
    if (!this.token) return;

    const url = `${BASE_URL_WS}/ws/${this.token}`;
    console.log(`[ChatWS] connecting | url=${url}`);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[ChatWS] open");
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.stopStableTimer();
      this.stableTimer = setTimeout(() => {
        this.reconnectAttempts = 0;
        this.stableTimer = null;
      }, GRACE_PERIOD_MS);
      this.startPing();
      this.flushPending();
      this.connectHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (msg) => {
      try {
        const raw =
          typeof msg.data === "string" ? msg.data : String((msg as any).data);
        const event: WsEvent = JSON.parse(raw);
        // Helpful during debugging: shows whether group_key/users_list/group_history arrive
        console.log(`[ChatWS] event | type=${(event as any).type}`);
        this.eventHandlers.forEach((h) => h(event));
      } catch (e) {
        const rawPreview =
          typeof (msg as any).data === "string"
            ? (msg as any).data.slice(0, 200)
            : String((msg as any).data).slice(0, 200);
        console.warn("[ChatWS] message parse failed", {
          error: (e as Error)?.message ?? String(e),
          rawPreview,
        });
      }
    };

    this.ws.onerror = () => {
      console.warn("[ChatWS] error");
      this.ws?.close();
    };

    this.ws.onclose = (e: WebSocketCloseEvent) => {
      const code = e.code ?? 0;
      const reason = e.reason || "";
      const wasUnstable = this.stableTimer !== null;

      this.stopStableTimer();
      this.stopPing();
      this.disconnectHandlers.forEach((h) => h());

      const isAuthError = code === 4001;
      const attemptsExhausted =
        this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS;

      console.log(
        `[ChatWS] closed | code=${code} reason="${reason}" attempt=${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}${wasUnstable ? " (unstable)" : ""}`,
      );

      if (isAuthError || !this.shouldReconnect || attemptsExhausted) {
        this.shouldReconnect = false;
        this.pendingMessages = [];
        if (this.fatalCloseHandler) {
          this.fatalCloseHandler(code, reason);
        }
        return;
      }

      this.reconnectAttempts++;
      if (this.reconnectHandler) {
        this.reconnectHandler(this.reconnectAttempts, MAX_RECONNECT_ATTEMPTS);
      }
      this.scheduleReconnect();
    };
  }

  private send(event: WsClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const json = JSON.stringify(event);
      const looksEncrypted =
        event.type === "group_message" || event.type === "dm"
          ? /^[A-Za-z0-9+/=]+$/.test((event as any).content) &&
            (event as any).content.length > 20
          : false;
      console.log(
        `[ChatWS] send | type=${event.type} len=${(event as any).content?.length ?? 0} encrypted=${looksEncrypted}`,
      );
      this.ws.send(json);
      return;
    }
    if (this.pendingMessages.length < MAX_QUEUE_SIZE) {
      this.pendingMessages.push(event);
    }
  }

  private flushPending(): void {
    while (this.pendingMessages.length > 0) {
      const msg = this.pendingMessages.shift()!;
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(msg));
      }
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: "ping" });
    }, PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private stopStableTimer(): void {
    if (this.stableTimer) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        MAX_RECONNECT_DELAY,
      );
    }, this.reconnectDelay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
