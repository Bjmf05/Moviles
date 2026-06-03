import { WsClientEvent, WsEvent } from "./types";

const BASE_URL_WS = process.env.EXO_PUBLIC_CHAT_BACKEND?.replace(/^https/, "wss") ?? "";
const PING_INTERVAL = 25000;
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

type EventHandler = (event: WsEvent) => void;
type StatusHandler = () => void;

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private shouldReconnect = false;

  private eventHandlers = new Set<EventHandler>();
  private connectHandlers = new Set<StatusHandler>();
  private disconnectHandlers = new Set<StatusHandler>();

  connect(token: string): void {
    this.token = token;
    this.shouldReconnect = true;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.createConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPing();
    this.clearReconnect();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  sendGroupMessage(content: string): void {
    this.send({ type: "group_message", content });
  }

  sendDM(toUserId: string, content: string): void {
    this.send({ type: "dm", to: toUserId, content });
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

  private createConnection(): void {
    if (!this.token) return;

    this.ws = new WebSocket(`${BASE_URL_WS}/ws/${this.token}`);

    this.ws.onopen = () => {
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.startPing();
      this.connectHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (msg) => {
      try {
        const event: WsEvent = JSON.parse(msg.data);
        this.eventHandlers.forEach((h) => h(event));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.disconnectHandlers.forEach((h) => h());
      if (this.shouldReconnect) this.scheduleReconnect();
    };
  }

  private send(event: WsClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
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
