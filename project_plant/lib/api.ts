const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(
    "API Response:",
    method,
    url,
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(
        () =>
          ({ error: "Request failed" }) as { error?: string; message?: string },
      );

    const errorLabel = errorBody?.error || "Request failed";
    const errorMessage = errorBody?.message ? `: ${errorBody.message}` : "";
    throw new Error(`${errorLabel}${errorMessage}`);
  }

  return response.json();
}

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  birthdate?: string;
  country?: string;
  photoURL?: string;
}

export interface Plant {
  id: string;
  userId: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: { riego: string; luz: string; temperatura: string };
  toxicidad: { esToxica: boolean; detalle: string };
  imageUri: string;
  notes: string;
  savedAt: string;
  isPublic?: boolean;
  ownerName?: string;
  ownerPhoto?: string;
}

export const api = {
  auth: {
    register: (data: {
      email: string;
      password: string;
      name: string;
      birthdate?: string;
      country?: string;
    }) =>
      apiRequest<{ user: AuthUser; token: string }>("/api/auth/register", {
        method: "POST",
        body: data,
      }),

    login: (data: { email: string; password: string }) =>
      apiRequest<{ user: AuthUser; token: string }>("/api/auth/login", {
        method: "POST",
        body: data,
      }),

    getProfile: (token: string) =>
      apiRequest<AuthUser>("/api/auth/profile", { token }),

    updateProfile: (token: string, data: Partial<AuthUser>) =>
      apiRequest<{ success: boolean }>("/api/auth/profile", {
        method: "PUT",
        body: data,
        token,
      }),

    googleLogin: (idToken: string) =>
      apiRequest<{ user: AuthUser; token: string }>("/api/auth/google", {
        method: "POST",
        body: { idToken },
      }),
  },

  plants: {
    explore: (params: {
      cursor?: string;
      limit?: number;
      search?: string;
      luz?: string;
      riego?: string;
      toxica?: string;
    }) => {
      const query = new URLSearchParams();
      if (params.cursor) query.set("cursor", params.cursor);
      if (params.limit) query.set("limit", String(params.limit));
      if (params.search) query.set("search", params.search);
      if (params.luz) query.set("luz", params.luz);
      if (params.riego) query.set("riego", params.riego);
      if (params.toxica) query.set("toxica", params.toxica);
      const qs = query.toString();
      return apiRequest<{
        plants: Plant[];
        hasMore: boolean;
        nextCursor: string | null;
      }>(`/api/plants/explore${qs ? `?${qs}` : ""}`);
    },

    getAll: (token: string) =>
      apiRequest<{ plants: Plant[] }>("/api/plants", { token }),

    get: (token: string, id: string) =>
      apiRequest<{ plant: Plant }>(`/api/plants/${id}`, { token }),

    create: (
      token: string,
      plant: Omit<Plant, "id" | "userId" | "savedAt">,
    ) =>
      apiRequest<Plant>("/api/plants", {
        method: "POST",
        body: plant,
        token,
      }),

    update: (token: string, id: string, updates: Partial<Plant>) =>
      apiRequest<{ success: boolean }>(`/api/plants/${id}`, {
        method: "PUT",
        body: updates,
        token,
      }),

    delete: (token: string, id: string) =>
      apiRequest<{ success: boolean }>(`/api/plants/${id}`, {
        method: "DELETE",
        token,
      }),
  },

  images: {
    upload: async (token: string, uri: string): Promise<string> => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      const uploadResponse = await fetch(`${API_URL}/api/images/base64`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64 }),
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const data = await uploadResponse.json();
      return data.url;
    },
  },
};
