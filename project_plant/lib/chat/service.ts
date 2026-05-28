import { ChatMessage, ChatUser } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_APP ?? "";

async function chatFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers["X-User-Token"] = options.token;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message ?? "Error en la solicitud";
    throw new Error(message);
  }

  return response.json();
}

export const chatApi = {
  join: (nickname: string) =>
    chatFetch<{ user: ChatUser; token: string }>("/api/chat/join", {
      method: "POST",
      body: { nickname },
    }),

  getOnlineUsers: () =>
    chatFetch<ChatUser[]>("/api/chat/users"),

  getGroupMessages: (limit = 50) =>
    chatFetch<ChatMessage[]>(`/api/chat/messages?limit=${limit}`),

  getDMHistory: (userId: string, token: string) =>
    chatFetch<ChatMessage[]>(`/api/chat/messages/dm/${userId}`, { token }),
};
