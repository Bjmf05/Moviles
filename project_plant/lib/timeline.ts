import { useCallback, useEffect, useState } from "react";
import { api, TimelineEntry } from "./api";
import { useAuth } from "../context/AuthContext";

export function useTimeline(plantId: string) {
  const { token } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await api.timeline.getAll(token, plantId);
      setEntries(result.entries);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [token, plantId]);

  const addEntry = useCallback(
    async (data: { imageUrl: string; caption?: string; capturedAt?: string }) => {
      if (!token) throw new Error("Not authenticated");
      await api.timeline.add(token, plantId, data);
      await load();
    },
    [token, plantId, load],
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (!token) throw new Error("Not authenticated");
      await api.timeline.delete(token, plantId, entryId);
      await load();
    },
    [token, plantId, load],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, addEntry, deleteEntry, reload: load };
}
