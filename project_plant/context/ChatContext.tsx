import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  decryptDM,
  decryptGroup,
  encryptDM,
  encryptGroup,
  generateKeyPair,
} from "../lib/chat/crypto";
import { chatApi } from "../lib/chat/service";
import { loadKeyPair, saveKeyPair } from "../lib/chat/storage";
import {
  ChatConnectionState,
  ChatMessage,
  ChatUser,
  ChatView,
  MessageSeenInfo,
  SendMessageOptions,
  WsEvent,
} from "../lib/chat/types";
import { ChatWebSocket } from "../lib/chat/websocket";

const USER_KEY = "@chat_user";
const TOKEN_KEY = "@chat_token";
const MAX_CIPHERTEXT_LENGTH = 1000;
const FAILED_DECRYPT_PLACEHOLDER = "[mensaje no descifrable]";

interface ChatContextValue {
  currentUser: ChatUser | null;
  token: string | null;
  isLoadingSession: boolean;
  connectionState: ChatConnectionState;
  reconnectProgress: string | null;
  onlineUsers: ChatUser[];
  groupMessages: ChatMessage[];
  directMessages: Record<string, ChatMessage[]>;
  messageReadStatus: Record<string, MessageSeenInfo[]>;
  activeView: ChatView;
  navigateTo: (view: ChatView) => void;
  joinChat: (nickname: string) => Promise<void>;
  leaveChat: () => void;
  sendGroupMessage: (content: string, opts?: SendMessageOptions) => void;
  sendDirectMessage: (
    userId: string,
    content: string,
    opts?: SendMessageOptions,
  ) => void;
  loadDirectMessages: (userId: string) => Promise<void>;
  uploadAndSendMedia: (
    fileUri: string,
    fileName: string,
    mimeType: string,
    type: "group" | "dm",
    userId?: string,
  ) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue>({
  currentUser: null,
  token: null,
  isLoadingSession: true,
  connectionState: "idle",
  reconnectProgress: null,
  onlineUsers: [],
  groupMessages: [],
  directMessages: {},
  messageReadStatus: {},
  activeView: "inbox",
  navigateTo: () => {},
  joinChat: async () => {},
  leaveChat: () => {},
  sendGroupMessage: () => {},
  sendDirectMessage: () => {},
  loadDirectMessages: async () => {},
  uploadAndSendMedia: async () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [connectionState, setConnectionState] =
    useState<ChatConnectionState>("idle");
  const [reconnectProgress, setReconnectProgress] = useState<string | null>(
    null,
  );
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [activeView, setActiveView] = useState<ChatView>("inbox");
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [userPublicKeys, setUserPublicKeys] = useState<Record<string, string>>(
    {},
  );
  const [myKeyPair, setMyKeyPair] = useState<{
    publicKey: string;
    secretKey: string;
  } | null>(null);
  const [messageReadStatus, setMessageReadStatus] = useState<
    Record<string, MessageSeenInfo[]>
  >({});

  const wsRef = useRef<ChatWebSocket | null>(null);
  const currentUserRef = useRef<ChatUser | null>(null);
  const groupKeyRef = useRef<string | null>(null);
  const groupKeyStatusRef = useRef<"pending" | "valid" | "invalid">("pending");
  const myKeyPairRef = useRef<typeof myKeyPair>(null);
  const userPublicKeysRef = useRef<Record<string, string>>({});
  const pendingGroupSendsRef = useRef<
    Array<{ content: string; opts?: SendMessageOptions }>
  >([]);
  const groupKeyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    groupKeyRef.current = groupKey;
  }, [groupKey]);

  useEffect(() => {
    myKeyPairRef.current = myKeyPair;
  }, [myKeyPair]);

  useEffect(() => {
    userPublicKeysRef.current = userPublicKeys;
  }, [userPublicKeys]);

  useEffect(() => {
    restoreSession();
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  const refreshOnlineUsersAndKeys = async () => {
    try {
      const users = await chatApi.getOnlineUsers();
      const updatedKeys: Record<string, string> = {
        ...userPublicKeysRef.current,
      };
      users.forEach((u) => {
        if (u.public_key) updatedKeys[u.id] = u.public_key;
      });
      userPublicKeysRef.current = updatedKeys;
      setOnlineUsers(users);
      setUserPublicKeys(updatedKeys);
    } catch {
      // ignore refresh errors
    }
  };

  const ensureMyKeyPair = async (opts?: {
    registerWithServer?: boolean;
    token?: string;
  }) => {
    let kp = myKeyPairRef.current;
    if (!kp) {
      const stored = await loadKeyPair();
      kp = stored ?? generateKeyPair();
      if (!stored) {
        await saveKeyPair(kp);
      }
      setMyKeyPair(kp);
      myKeyPairRef.current = kp;
    }

    if (opts?.registerWithServer && opts.token) {
      try {
        await chatApi.registerPublicKey(opts.token, kp.publicKey);
      } catch {
        // ignore register errors (token may be expired)
      }
    }

    return kp;
  };

  const restoreSession = async () => {
    try {
      const [storedUser, storedToken, kp] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(TOKEN_KEY),
        loadKeyPair(),
      ]);

      if (kp) {
        setMyKeyPair(kp);
        myKeyPairRef.current = kp;
      }

      if (storedUser && storedToken) {
        const parsed: ChatUser = JSON.parse(storedUser);
        setCurrentUser(parsed);
        currentUserRef.current = parsed;
        setToken(storedToken);
        // Ensure keypair exists and re-register it (important after backend restarts)
        await ensureMyKeyPair({ registerWithServer: true, token: storedToken });
        connectWebSocket(storedToken);
      }
    } catch {
      // ignore restore errors
    } finally {
      setIsLoadingSession(false);
    }
  };

  const connectWebSocket = (wsToken: string) => {
    const ws = new ChatWebSocket();

    // Reset group key state for the new socket.
    groupKeyStatusRef.current = "pending";
    groupKeyRef.current = null;
    setGroupKey(null);

    // Clear any previous timeout
    if (groupKeyTimeoutRef.current) {
      clearTimeout(groupKeyTimeoutRef.current);
      groupKeyTimeoutRef.current = null;
    }

    // Auto-invalidate group_key if not received within 3 seconds
    groupKeyTimeoutRef.current = setTimeout(() => {
      if (groupKeyStatusRef.current === "pending") {
        console.warn(
          "[Chat] group_key not received within 3s — disabling group encryption",
        );
        groupKeyStatusRef.current = "invalid";
        setGroupKey(null);
        groupKeyRef.current = null;

        // Flush queued messages as plaintext
        const pending = pendingGroupSendsRef.current;
        if (pending.length > 0) {
          pendingGroupSendsRef.current = [];
          pending.forEach(({ content, opts }) => {
            if (content.length > 1000) return;
            wsRef.current?.sendGroupMessage(content, {
              ttl: opts?.ttl,
              allow_read_receipt: opts?.allow_read_receipt,
              media: opts?.media,
            });
          });
        }
      }
      groupKeyTimeoutRef.current = null;
    }, 3000);

    ws.onEvent(handleWsEvent);
    ws.onConnect(() => {
      setConnectionState("connected");
      setReconnectProgress(null);
    });
    ws.onDisconnect(() => setConnectionState("disconnected"));
    ws.onReconnecting((attempt, max) => {
      setReconnectProgress(`Reconectando... (${attempt}/${max})`);
    });
    ws.onFatalClose(() => {
      console.log("[Chat] fatal WS close — auto-leaving");
      leaveChat();
    });

    setConnectionState("connecting");
    ws.connect(wsToken);
    wsRef.current = ws;
  };

  const handleWsEvent = useCallback((event: WsEvent) => {
    switch (event.type) {
      case "group_history": {
        const gk = groupKeyRef.current;
        if (gk && groupKeyStatusRef.current === "valid") {
          // group_key already received, decrypt immediately
          setGroupMessages((prev) => {
            const decrypted = event.messages.map((m) => {
              const looksEncrypted =
                /^[A-Za-z0-9+/=]+$/.test(m.content) && m.content.length > 16;
              if (!looksEncrypted) return m;
              return {
                ...m,
                content: (() => {
                  try {
                    return (
                      decryptGroup(m.content, gk) ??
                      FAILED_DECRYPT_PLACEHOLDER
                    );
                  } catch {
                    return FAILED_DECRYPT_PLACEHOLDER;
                  }
                })(),
              };
            });
            return prev.length === 0 ? decrypted : prev;
          });
        } else {
          // group_key not yet received, store encrypted
          setGroupMessages(event.messages);
        }
        break;
      }

      case "group_key": {
        // Clear the auto-invalidate timeout since we got a response
        if (groupKeyTimeoutRef.current) {
          clearTimeout(groupKeyTimeoutRef.current);
          groupKeyTimeoutRef.current = null;
        }

        if (!event.key) {
          console.warn(
            "Chat: invalid group_key received (empty). Group encryption disabled.",
          );
          groupKeyStatusRef.current = "invalid";
          setGroupKey(null);
          groupKeyRef.current = null;

          // Flush queued group messages in plaintext mode.
          const pendingPlain = pendingGroupSendsRef.current;
          if (pendingPlain.length > 0) {
    pendingGroupSendsRef.current = [];
    if (groupKeyTimeoutRef.current) {
      clearTimeout(groupKeyTimeoutRef.current);
      groupKeyTimeoutRef.current = null;
    }
            pendingPlain.forEach(({ content, opts }) => {
              if (content.length > 1000) return;
              wsRef.current?.sendGroupMessage(content, {
                ttl: opts?.ttl,
                allow_read_receipt: opts?.allow_read_receipt,
                media: opts?.media,
              });
            });
          }
          break;
        }

        groupKeyStatusRef.current = "valid";
        setGroupKey(event.key);
        groupKeyRef.current = event.key;
        // decrypt any buffered encrypted group_history
        setGroupMessages((prev) =>
          prev.map((m) => {
            const looksEncrypted =
              /^[A-Za-z0-9+/=]+$/.test(m.content) && m.content.length > 16;
            if (!looksEncrypted) return m;
            return {
              ...m,
              content: (() => {
                try {
                  return (
                    decryptGroup(m.content, event.key) ??
                    FAILED_DECRYPT_PLACEHOLDER
                  );
                } catch {
                  return FAILED_DECRYPT_PLACEHOLDER;
                }
              })(),
            };
          }),
        );

        // flush any group messages queued before group_key arrived
        const pending = pendingGroupSendsRef.current;
        if (pending.length > 0) {
          pendingGroupSendsRef.current = [];
          pending.forEach(({ content, opts }) => {
            let ciphertext = "";
            try {
              ciphertext = encryptGroup(content, event.key);
            } catch {
              console.warn(
                "Chat: failed to encrypt queued group message (invalid group_key).",
              );
              return;
            }
            if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) return;
            wsRef.current?.sendGroupMessage(ciphertext, {
              ttl: opts?.ttl,
              allow_read_receipt: opts?.allow_read_receipt,
              media: opts?.media,
            });
          });
        }
        break;
      }

      case "group_message": {
        const gk = groupKeyRef.current;
        const rawContent = event.message.content;

        const looksEncrypted =
          /^[A-Za-z0-9+/=]+$/.test(rawContent) && rawContent.length > 16;

        const decryptedContent =
          gk && groupKeyStatusRef.current === "valid" && looksEncrypted
            ? (() => {
                try {
                  return (
                    decryptGroup(rawContent, gk) ??
                    FAILED_DECRYPT_PLACEHOLDER
                  );
                } catch {
                  return FAILED_DECRYPT_PLACEHOLDER;
                }
              })()
            : looksEncrypted
              ? FAILED_DECRYPT_PLACEHOLDER
              : rawContent;
        setGroupMessages((prev) => [
          ...prev,
          { ...event.message, content: decryptedContent },
        ]);
        if (
          event.message.allow_read_receipt &&
          event.message.sender_id !== currentUserRef.current?.id
        ) {
          wsRef.current?.markRead(event.message.id);
        }
        break;
      }

      case "dm": {
        const self = currentUserRef.current;
        const otherId =
          event.message.sender_id === self?.id
            ? event.message.recipient_id!
            : event.message.sender_id;
        const otherKey = userPublicKeysRef.current[otherId];
        const myKey = myKeyPairRef.current;
        const rawContent = event.message.content;

        const looksEncrypted =
          /^[A-Za-z0-9+/=]+$/.test(rawContent) && rawContent.length > 16;

        const decryptedContent =
          otherKey && myKey && looksEncrypted
            ? (() => {
                try {
                  return (
                    decryptDM(rawContent, otherKey, myKey.secretKey) ??
                    rawContent
                  );
                } catch {
                  return rawContent;
                }
              })()
            : looksEncrypted && (!otherKey || !myKey)
              ? FAILED_DECRYPT_PLACEHOLDER
              : rawContent;
        setDirectMessages((prev) => ({
          ...prev,
          [otherId]: [
            ...(prev[otherId] || []),
            { ...event.message, content: decryptedContent },
          ],
        }));
        if (
          event.message.allow_read_receipt &&
          event.message.sender_id !== currentUserRef.current?.id
        ) {
          wsRef.current?.markRead(event.message.id);
        }
        break;
      }

      case "users_list": {
        setOnlineUsers(event.users);
        const updated: Record<string, string> = {
          ...userPublicKeysRef.current,
        };
        event.users.forEach((u) => {
          if (u.public_key) updated[u.id] = u.public_key;
        });
        userPublicKeysRef.current = updated;
        setUserPublicKeys(updated);
        break;
      }

      case "user_joined": {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.id === event.user.id)) return prev;
          return [...prev, event.user];
        });
        if (event.user.public_key) {
          const updated: Record<string, string> = {
            ...userPublicKeysRef.current,
            [event.user.id]: event.user.public_key!,
          };
          userPublicKeysRef.current = updated;
          setUserPublicKeys(updated);
        }
        break;
      }

      case "user_left":
        setOnlineUsers((prev) => prev.filter((u) => u.id !== event.user_id));
        break;

      case "message_seen":
        setMessageReadStatus((prev) => {
          const existing = prev[event.message_id] || [];
          if (existing.some((s) => s.seen_by === event.seen_by)) return prev;
          return {
            ...prev,
            [event.message_id]: [
              ...existing,
              { seen_by: event.seen_by, seen_at: event.seen_at },
            ],
          };
        });
        break;

      case "message_expired":
        setGroupMessages((prev) =>
          prev.filter((m) => m.id !== event.message_id),
        );
        setDirectMessages((prev) => {
          const updated = { ...prev };
          for (const key of Object.keys(updated)) {
            updated[key] = updated[key].filter(
              (m) => m.id !== event.message_id,
            );
            if (updated[key].length === 0) delete updated[key];
          }
          return updated;
        });
        break;

      case "error":
        console.warn("Chat WS error:", event.message);
        break;
    }
  }, []);

  const joinChat = async (nickname: string) => {
    const { user, token: chatToken } = await chatApi.join(nickname);

    // Load or generate keypair
    let kp = await loadKeyPair();
    if (!kp) {
      kp = generateKeyPair();
      await saveKeyPair(kp);
    }
    setMyKeyPair(kp);

    // Register public key with server before connecting WS
    await chatApi.registerPublicKey(chatToken, kp.publicKey);

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(TOKEN_KEY, chatToken);
    setCurrentUser(user);
    currentUserRef.current = user;
    myKeyPairRef.current = kp;
    setToken(chatToken);
    connectWebSocket(chatToken);

    // Refresh online users to populate public keys after WS connects
    setTimeout(() => {
      refreshOnlineUsersAndKeys();
    }, 2000);
  };

  const leaveChat = () => {
    const currentToken = token;
    wsRef.current?.disconnect();
    wsRef.current = null;
    AsyncStorage.removeItem(USER_KEY);
    AsyncStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    currentUserRef.current = null;
    setToken(null);
    setConnectionState("idle");
    setReconnectProgress(null);
    setOnlineUsers([]);
    setGroupMessages([]);
    setDirectMessages({});
    setMessageReadStatus({});
    setActiveView("inbox");
    setGroupKey(null);
    groupKeyRef.current = null;
    groupKeyStatusRef.current = "pending";
    setUserPublicKeys({});
    userPublicKeysRef.current = {};
    setMyKeyPair(null);
    myKeyPairRef.current = null;
    pendingGroupSendsRef.current = [];
    if (currentToken) {
      chatApi.logout(currentToken).catch(() => {});
    }
  };

  const sendGroupMessage = (content: string, opts?: SendMessageOptions) => {
    const gk = groupKeyRef.current;
    const keyStatus = groupKeyStatusRef.current;

    if (keyStatus === "invalid") {
      // Backend didn't provide a usable group key; send plaintext.
      if (content.length > 1000) {
        console.warn("Chat: message exceeds max length");
        return;
      }
      wsRef.current?.sendGroupMessage(content, {
        ttl: opts?.ttl,
        allow_read_receipt: opts?.allow_read_receipt,
        media: opts?.media,
      });
      console.log(
        `[Chat] group msg sent len=${content.length} encrypted=false`,
      );
      return;
    }

    if (!gk) {
      // Queue until group_key arrives (WS can connect slightly before keys are sent)
      pendingGroupSendsRef.current.push({ content, opts });
      console.warn("Chat: group_key not received yet, message queued");
      return;
    }

    let ciphertext = "";
    try {
      ciphertext = encryptGroup(content, gk);
    } catch {
      console.warn("Chat: failed to encrypt group message; sending plaintext");
      if (content.length > 1000) {
        console.warn("Chat: message exceeds max length");
        return;
      }
      wsRef.current?.sendGroupMessage(content, {
        ttl: opts?.ttl,
        allow_read_receipt: opts?.allow_read_receipt,
        media: opts?.media,
      });
      console.log(
        `[Chat] group msg sent (encrypt failed) len=${content.length} encrypted=false`,
      );
      return;
    }
    if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
      console.warn("Chat: ciphertext exceeds max length");
      return;
    }
    wsRef.current?.sendGroupMessage(ciphertext, {
      ttl: opts?.ttl,
      allow_read_receipt: opts?.allow_read_receipt,
      media: opts?.media,
    });
    console.log(
      `[Chat] group msg sent len=${ciphertext.length} encrypted=true`,
    );
  };

  const sendDirectMessage = (
    userId: string,
    content: string,
    opts?: SendMessageOptions,
  ) => {
    void (async () => {
      const currentToken = token;
      const myKey = await ensureMyKeyPair({
        registerWithServer: Boolean(currentToken),
        token: currentToken ?? undefined,
      });

      let recipientKey = userPublicKeysRef.current[userId];
      if (!recipientKey) {
        await refreshOnlineUsersAndKeys();
        recipientKey = userPublicKeysRef.current[userId];
      }

      if (!recipientKey || !myKey) {
        console.warn(
          `Chat: missing keys for DM to=${userId.slice(0, 8)} — sending plaintext`,
        );
        if (content.length > 1000) {
          console.warn("Chat: message exceeds max length");
          return;
        }
        wsRef.current?.sendDM(userId, content, {
          ttl: opts?.ttl,
          allow_read_receipt: opts?.allow_read_receipt,
          media: opts?.media,
        });
        console.log(
          `[Chat] dm sent to=${userId.slice(0, 8)} len=${content.length} encrypted=false`,
        );
        return;
      }

      const ciphertext = encryptDM(content, recipientKey, myKey.secretKey);
      if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
        console.warn("Chat: ciphertext exceeds max length");
        return;
      }
      wsRef.current?.sendDM(userId, ciphertext, {
        ttl: opts?.ttl,
        allow_read_receipt: opts?.allow_read_receipt,
        media: opts?.media,
      });
      console.log(
        `[Chat] dm sent to=${userId.slice(0, 8)} len=${ciphertext.length} encrypted=true`,
      );
    })();
  };

  const loadDirectMessages = async (userId: string) => {
    if (!token) return;
    const messages = await chatApi.getDMHistory(userId, token);
    const otherKey = userPublicKeysRef.current[userId];
    const myKey = myKeyPairRef.current;

    if (otherKey && myKey) {
      const decrypted = messages.map((m) => {
        const looksEncrypted =
          /^[A-Za-z0-9+/=]+$/.test(m.content) && m.content.length > 16;
        if (!looksEncrypted) return m;
        return {
          ...m,
          content: (() => {
            try {
              return decryptDM(m.content, otherKey, myKey.secretKey) ?? m.content;
            } catch {
              return m.content;
            }
          })(),
        };
      });
      setDirectMessages((prev) => ({ ...prev, [userId]: decrypted }));
    } else {
      setDirectMessages((prev) => ({ ...prev, [userId]: messages }));
    }
  };

  const uploadAndSendMedia = async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    type: "group" | "dm",
    userId?: string,
  ) => {
    const currentToken = token;
    if (!currentToken) throw new Error("No hay sesión activa");

    const media = await chatApi.uploadMedia(
      currentToken,
      fileUri,
      fileName,
      mimeType,
    );

    if (type === "group") {
      sendGroupMessage("", { media });
    } else if (userId) {
      sendDirectMessage(userId, "", { media });
    }
  };

  const navigateTo = (view: ChatView) => {
    setActiveView(view);
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        token,
        isLoadingSession,
        connectionState,
        reconnectProgress,
        onlineUsers,
        groupMessages,
        directMessages,
        messageReadStatus,
        activeView,
        navigateTo,
        joinChat,
        leaveChat,
        sendGroupMessage,
        sendDirectMessage,
        loadDirectMessages,
        uploadAndSendMedia,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
