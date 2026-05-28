import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { chatApi } from "../lib/chat/service";
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

  const wsRef = useRef<ChatWebSocket | null>(null);
  const currentUserRef = useRef<ChatUser | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

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
      case "group_history":
        setGroupMessages(event.messages);
        break;

      case "group_message":
        setGroupMessages((prev) => [...prev, event.message]);
        break;

      case "dm":
        setDirectMessages((prev) => {
          const self = currentUserRef.current;
          const otherId =
            event.message.sender_id === self?.id
              ? event.message.recipient_id!
              : event.message.sender_id;
          return {
            ...prev,
            [otherId]: [...(prev[otherId] || []), event.message],
          };
        });
        break;

      case "users_list":
        setOnlineUsers(event.users);
        break;

      case "user_joined":
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.id === event.user.id)) return prev;
          return [...prev, event.user];
        });
        break;

      case "user_left":
        setOnlineUsers((prev) =>
          prev.filter((u) => u.id !== event.user_id),
        );
        break;

      case "error":
        console.warn("Chat WS error:", event.message);
        break;
    }
  }, []);

  const joinChat = async (nickname: string) => {
    const { user, token: chatToken } = await chatApi.join(nickname);
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
  };

  const sendGroupMessage = (content: string) => {
    wsRef.current?.sendGroupMessage(content);
  };

  const sendDirectMessage = (userId: string, content: string) => {
    wsRef.current?.sendDM(userId, content);
  };

  const loadDirectMessages = async (userId: string) => {
    if (!token) return;
    const messages = await chatApi.getDMHistory(userId, token);
    setDirectMessages((prev) => ({ ...prev, [userId]: messages }));
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
