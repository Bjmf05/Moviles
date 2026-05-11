const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface ApiPlant {
  id: string;
  nombreComun: string;
  imageUri?: string;
}

export interface CalendarWatering {
  date: string;
  plantId: string;
  nombreComun: string;
  completed: boolean;
}

export interface CalendarResponse {
  waterings: CalendarWatering[];
  plants: ApiPlant[];
}

export interface ScheduleUpdate {
  frequencyDays?: number;
  nextWateringDate?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorBody?.error || "Request failed");
  }

  return response.json();
}

export const calendarApi = {
  getMonth: (token: string, month: number, year: number) =>
    apiRequest<CalendarResponse>(`/api/calendar?month=${month}&year=${year}`, { token }),

  markWatered: (token: string, plantId: string) =>
    apiRequest<{ success: boolean; nextWateringDate: string }>(`/api/plants/${plantId}/water`, {
      method: "POST",
      token,
    }),

  editSchedule: (token: string, plantId: string, data: ScheduleUpdate) =>
    apiRequest<{ success: boolean }>(`/api/plants/${plantId}/schedule`, {
      method: "PUT",
      body: data,
      token,
    }),
};
