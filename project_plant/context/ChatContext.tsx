import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { decryptDM, decryptGroup, encryptDM, encryptGroup, generateKeyPair } from "../lib/chat/crypto";
import { chatApi } from "../lib/chat/service";
import { loadKeyPair, saveKeyPair } from "../lib/chat/storage";
import {
  ChatConnectionState,
  ChatMessage,
  ChatUser,
  ChatView,
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
  onlineUsers: ChatUser[];
  groupMessages: ChatMessage[];
  directMessages: Record<string, ChatMessage[]>;
  activeView: ChatView;
  navigateTo: (view: ChatView) => void;
  joinChat: (nickname: string) => Promise<void>;
  leaveChat: () => void;
  sendGroupMessage: (content: string) => void;
  sendDirectMessage: (userId: string, content: string) => void;
  loadDirectMessages: (userId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue>({
  currentUser: null,
  token: null,
  isLoadingSession: true,
  connectionState: "idle",
  onlineUsers: [],
  groupMessages: [],
  directMessages: {},
  activeView: "inbox",
  navigateTo: () => {},
  joinChat: async () => {},
  leaveChat: () => {},
  sendGroupMessage: () => {},
  sendDirectMessage: () => {},
  loadDirectMessages: async () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [connectionState, setConnectionState] =
    useState<ChatConnectionState>("idle");
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [activeView, setActiveView] = useState<ChatView>("inbox");
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [userPublicKeys, setUserPublicKeys] = useState<Record<string, string>>({});
  const [myKeyPair, setMyKeyPair] = useState<{
    publicKey: string;
    secretKey: string;
  } | null>(null);

  const wsRef = useRef<ChatWebSocket | null>(null);
  const currentUserRef = useRef<ChatUser | null>(null);
  const groupKeyRef = useRef<string | null>(null);
  const myKeyPairRef = useRef<typeof myKeyPair>(null);
  const userPublicKeysRef = useRef<Record<string, string>>({});

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

  const restoreSession = async () => {
    try {
      const [storedUser, storedToken, kp] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(TOKEN_KEY),
        loadKeyPair(),
      ]);

      if (kp) {
        setMyKeyPair(kp);
      }

      if (storedUser && storedToken) {
        const parsed: ChatUser = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setToken(storedToken);
        connectWebSocket(storedToken);
      }
    } catch {
      // ignore restore errors
    } finally {
      setIsLoadingSession(false);
    }
  };

  const tryDecryptGroupMessages = useCallback(
    (messages: ChatMessage[], key: string): ChatMessage[] => {
      return messages.map((m) => ({
        ...m,
        content: decryptGroup(m.content, key) ?? FAILED_DECRYPT_PLACEHOLDER,
      }));
    },
    [],
  );

  const connectWebSocket = (wsToken: string) => {
    const ws = new ChatWebSocket();

    ws.onEvent(handleWsEvent);
    ws.onConnect(() => setConnectionState("connected"));
    ws.onDisconnect(() => setConnectionState("disconnected"));

    setConnectionState("connecting");
    ws.connect(wsToken);
    wsRef.current = ws;
  };

  const handleWsEvent = useCallback((event: WsEvent) => {
    switch (event.type) {
      case "group_history": {
        const gk = groupKeyRef.current;
        if (gk) {
          // group_key already received, decrypt immediately
          setGroupMessages((prev) => {
            const decrypted = event.messages.map((m) => ({
              ...m,
              content: decryptGroup(m.content, gk) ?? FAILED_DECRYPT_PLACEHOLDER,
            }));
            return prev.length === 0 ? decrypted : prev;
          });
        } else {
          // group_key not yet received, store encrypted
          setGroupMessages(event.messages);
        }
        break;
      }

      case "group_key": {
        setGroupKey(event.key);
        // decrypt any buffered encrypted group_history
        setGroupMessages((prev) =>
          prev.map((m) => ({
            ...m,
            content: decryptGroup(m.content, event.key) ?? FAILED_DECRYPT_PLACEHOLDER,
          })),
        );
        break;
      }

      case "group_message": {
        const gk = groupKeyRef.current;
        const decryptedContent = gk
          ? decryptGroup(event.message.content, gk) ?? FAILED_DECRYPT_PLACEHOLDER
          : event.message.content;
        setGroupMessages((prev) => [
          ...prev,
          { ...event.message, content: decryptedContent },
        ]);
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
        const decryptedContent =
          otherKey && myKey
            ? decryptDM(event.message.content, otherKey, myKey.secretKey) ??
              FAILED_DECRYPT_PLACEHOLDER
            : event.message.content;
        setDirectMessages((prev) => ({
          ...prev,
          [otherId]: [
            ...(prev[otherId] || []),
            { ...event.message, content: decryptedContent },
          ],
        }));
        break;
      }

      case "users_list": {
        setOnlineUsers(event.users);
        setUserPublicKeys((prev) => {
          const updated = { ...prev };
          event.users.forEach((u) => {
            if (u.public_key) updated[u.id] = u.public_key;
          });
          return updated;
        });
        break;
      }

      case "user_joined": {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.id === event.user.id)) return prev;
          return [...prev, event.user];
        });
        if (event.user.public_key) {
          setUserPublicKeys((prev) => ({
            ...prev,
            [event.user.id]: event.user.public_key!,
          }));
        }
        break;
      }

      case "user_left":
        setOnlineUsers((prev) =>
          prev.filter((u) => u.id !== event.user_id),
        );
        break;

      case "message_seen":
      case "message_expired":
        // handled in future updates (read receipts, TTL)
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
    setToken(chatToken);
    connectWebSocket(chatToken);
  };

  const leaveChat = () => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    AsyncStorage.removeItem(USER_KEY);
    AsyncStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setToken(null);
    setConnectionState("idle");
    setOnlineUsers([]);
    setGroupMessages([]);
    setDirectMessages({});
    setActiveView("inbox");
    setGroupKey(null);
    setUserPublicKeys({});
  };

  const sendGroupMessage = (content: string) => {
    const gk = groupKeyRef.current;
    if (!gk) return;
    const ciphertext = encryptGroup(content, gk);
    if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
      console.warn("Ciphertext exceeds max length");
      return;
    }
    wsRef.current?.sendGroupMessage(ciphertext);
  };

  const sendDirectMessage = (userId: string, content: string) => {
    const recipientKey = userPublicKeysRef.current[userId];
    const myKey = myKeyPairRef.current;
    if (!recipientKey || !myKey) return;
    const ciphertext = encryptDM(content, recipientKey, myKey.secretKey);
    if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
      console.warn("Ciphertext exceeds max length");
      return;
    }
    wsRef.current?.sendDM(userId, ciphertext);
  };

  const loadDirectMessages = async (userId: string) => {
    if (!token) return;
    const messages = await chatApi.getDMHistory(userId, token);
    const otherKey = userPublicKeysRef.current[userId];
    const myKey = myKeyPairRef.current;

    if (otherKey && myKey) {
      const decrypted = messages.map((m) => ({
        ...m,
        content:
          decryptDM(m.content, otherKey, myKey.secretKey) ??
          FAILED_DECRYPT_PLACEHOLDER,
      }));
      setDirectMessages((prev) => ({ ...prev, [userId]: decrypted }));
    } else {
      setDirectMessages((prev) => ({ ...prev, [userId]: messages }));
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
        onlineUsers,
        groupMessages,
        directMessages,
        activeView,
        navigateTo,
        joinChat,
        leaveChat,
        sendGroupMessage,
        sendDirectMessage,
        loadDirectMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
