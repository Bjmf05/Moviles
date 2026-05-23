import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { calendarApi, CalendarWatering, CalendarResponse } from "../lib/calendar";
import { useAuth } from "../context/AuthContext";
import {
  cancelNotification,
  requestNotificationPermission,
  scheduleWateringNotification,
} from "../lib/notifications";

export function useCalendar() {
  const { token } = useAuth();
  const [waterings, setWaterings] = useState<CalendarWatering[]>([]);
  const [plants, setPlants] = useState<CalendarResponse["plants"]>([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const notifIds = useRef<Map<string, string>>(new Map());

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

  const scheduleForPlant = useCallback(async (plantId: string, plantName: string, nextWateringDate: string) => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        "Permiso de notificaciones",
        "No recibirás recordatorios de riego. Puedes activar los permisos en Configuración > Notificaciones.",
      );
      return;
    }
    const oldId = notifIds.current.get(plantId);
    if (oldId) await cancelNotification(oldId);
    const newId = await scheduleWateringNotification(plantName, nextWateringDate);
    if (newId) notifIds.current.set(plantId, newId);
  }, []);

  const markAsWatered = useCallback(async (plantId: string) => {
    if (!token) return;
    try {
      const result = await calendarApi.markWatered(token, plantId);
      const plant = plants.find((p) => p.id === plantId);
      if (plant) {
        await scheduleForPlant(plantId, plant.nombreComun, result.nextWateringDate);
      }
      await loadMonth(month, year);
      return result;
    } catch (e) {
      console.error("Failed to mark watered:", e);
      throw e;
    }
  }, [token, plants, month, year, loadMonth, scheduleForPlant]);

  const editSchedule = useCallback(async (plantId: string, data: { frequencyDays?: number; nextWateringDate?: string }) => {
    if (!token) return;
    try {
      await calendarApi.editSchedule(token, plantId, data);
      const plant = plants.find((p) => p.id === plantId);
      if (plant && data.nextWateringDate) {
        await scheduleForPlant(plantId, plant.nombreComun, data.nextWateringDate);
      }
      await loadMonth(month, year);
    } catch (e) {
      console.error("Failed to edit schedule:", e);
      throw e;
    }
  }, [token, plants, month, year, loadMonth, scheduleForPlant]);

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
