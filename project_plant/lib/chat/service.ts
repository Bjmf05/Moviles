import { ChatMessage, ChatUser, MediaAttachment } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_BACKEND ?? "";

async function chatFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
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

  logout: (token: string) =>
    chatFetch<{ status: string }>("/api/chat/logout", {
      method: "POST",
      token,
    }),

  getOnlineUsers: () =>
    chatFetch<ChatUser[]>("/api/chat/users"),

  getGroupMessages: (limit = 50) =>
    chatFetch<ChatMessage[]>(`/api/chat/messages?limit=${limit}`),

  getDMHistory: (userId: string, token: string) =>
    chatFetch<ChatMessage[]>(`/api/chat/messages/dm/${userId}`, { token }),

  registerPublicKey: (token: string, publicKey: string) =>
    chatFetch<{ status: string }>("/api/chat/users/me/public-key", {
      method: "PUT",
      body: { public_key: publicKey },
      token,
    }),

  uploadMedia: async (
    token: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<MediaAttachment> => {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const response = await fetch(`${BASE_URL}/api/chat/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : detail?.message ?? "Error al subir archivo";
      throw new Error(message);
    }

    return response.json();
  },
};


