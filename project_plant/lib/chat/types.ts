export interface MediaAttachment {
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  size_bytes: number;
  original_filename: string;
  width: number;
  height: number;
  duration: number | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_nickname: string;
  content: string;
  type: "group" | "dm";
  recipient_id: string | null;
  timestamp: string;
  ttl: number | null;
  expires_at: string | null;
  allow_read_receipt: boolean;
  media: MediaAttachment | null;
}

export interface ChatUser {
  id: string;
  nickname: string;
  joined_at: string;
  is_online: boolean;
  public_key: string | null;
}

export type WsEvent =
  | { type: "group_message"; message: ChatMessage }
  | { type: "dm"; message: ChatMessage }
  | { type: "user_joined"; user: ChatUser }
  | { type: "user_left"; user_id: string }
  | { type: "users_list"; users: ChatUser[] }
  | { type: "group_history"; messages: ChatMessage[] }
  | { type: "group_key"; key: string }
  | { type: "message_seen"; message_id: string; seen_by: string; seen_at: string }
  | { type: "message_expired"; message_id: string }
  | { type: "pong" }
  | { type: "error"; message: string };

export type WsClientEvent =
  | { type: "group_message"; content: string }
  | { type: "dm"; to: string; content: string }
  | { type: "mark_read"; message_id: string }
  | { type: "ping" };

export type ChatConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";

export type ChatView = "inbox" | "group" | { dm: { userId: string; nickname: string } };
