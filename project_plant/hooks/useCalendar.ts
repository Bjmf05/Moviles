import { useCallback, useState } from "react";
import { calendarApi, CalendarWatering, CalendarResponse } from "../lib/calendar";
import { useAuth } from "../context/AuthContext";
import { cancelAllNotifications, scheduleWateringNotification } from "../lib/notifications";

export function useCalendar() {
  const { token } = useAuth();
  const [waterings, setWaterings] = useState<CalendarWatering[]>([]);
  const [plants, setPlants] = useState<CalendarResponse["plants"]>([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const loadMonth = useCallback(async (m: number, y: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await calendarApi.getMonth(token, m, y);
      setWaterings(data.waterings);
      setPlants(data.plants);
    } catch (e) {
      console.error("Failed to load calendar:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const goToPrevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const markAsWatered = useCallback(async (plantId: string) => {
    if (!token) return;
    try {
      const result = await calendarApi.markWatered(token, plantId);
      await cancelAllNotifications();
      const plant = plants.find((p) => p.id === plantId);
      if (plant) {
        await scheduleWateringNotification(plant.nombreComun, result.nextWateringDate);
      }
      await loadMonth(month, year);
      return result;
    } catch (e) {
      console.error("Failed to mark watered:", e);
      throw e;
    }
  }, [token, plants, month, year, loadMonth]);

  const editSchedule = useCallback(async (plantId: string, data: { frequencyDays?: number; nextWateringDate?: string }) => {
    if (!token) return;
    try {
      await calendarApi.editSchedule(token, plantId, data);
      await cancelAllNotifications();
      await loadMonth(month, year);
    } catch (e) {
      console.error("Failed to edit schedule:", e);
      throw e;
    }
  }, [token, month, year, loadMonth]);

  const getWateringsForDay = useCallback((day: number): CalendarWatering[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return waterings.filter((w) => w.date === dateStr);
  }, [waterings, month, year]);

  return {
    waterings,
    plants,
    loading,
    month,
    year,
    setMonth,
    setYear,
    loadMonth,
    goToPrevMonth,
    goToNextMonth,
    markAsWatered,
    editSchedule,
    getWateringsForDay,
  };
}
