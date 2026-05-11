import { Request, Response } from "express";
import { getFirestore } from "../services/firebase.js";

const EVENTS_COLLECTION = "watering_events";

export async function getCalendarMonth(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const month = parseInt(req.query.month as string, 10);
    const year = parseInt(req.query.year as string, 10);
    if (isNaN(month) || isNaN(year) || month < 0 || month > 11) {
      res.status(400).json({ error: "Invalid month or year" });
      return;
    }

    const db = getFirestore();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    const startDateStr = startOfMonth.toISOString().split("T")[0];
    const endDateStr = endOfMonth.toISOString().split("T")[0];

    const plantsSnapshot = await db
      .collection("plants")
      .where("userId", "==", uid)
      .get();

    const plants = plantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      nombreComun: string;
      nombreCientifico: string;
      wateringSchedule?: {
        frequencyDays: number;
        nextWateringDate: string;
        lastWateredDate: string | null;
      };
      imageUri?: string;
    }>;

    const allEventsSnapshot = await db
      .collection(EVENTS_COLLECTION)
      .where("userId", "==", uid)
      .get();

    const completedDates: Array<{ plantId: string; date: string }> = [];
    allEventsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const eventDate = data.completedAt?.split("T")[0];
      if (eventDate && eventDate >= startDateStr && eventDate <= endDateStr) {
        completedDates.push({
          plantId: data.plantId,
          date: eventDate,
        });
      }
    });

    const completedSet = new Set(completedDates.map((e) => `${e.plantId}_${e.date}`));

    const waterings: Array<{
      date: string;
      plantId: string;
      nombreComun: string;
      completed: boolean;
    }> = [];

    for (const plant of plants) {
      const schedule = plant.wateringSchedule;
      if (!schedule || !schedule.frequencyDays || !schedule.nextWateringDate) continue;

      // Ir hacia atrás desde nextWateringDate hasta antes del mes
      let start = new Date(schedule.nextWateringDate + "T12:00:00");
      while (start >= startOfMonth) {
        start.setDate(start.getDate() - schedule.frequencyDays);
      }
      // Avanzar un paso para caer dentro del mes
      start.setDate(start.getDate() + schedule.frequencyDays);

      const end = new Date(year, month + 1, 0, 23, 59, 59);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + schedule.frequencyDays)) {
        const dateStr = d.toISOString().split("T")[0];
        if (dateStr >= startDateStr) {
          waterings.push({
            date: dateStr,
            plantId: plant.id,
            nombreComun: plant.nombreComun,
            completed: completedSet.has(`${plant.id}_${dateStr}`),
          });
        }
      }
    }

    waterings.sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      waterings,
      plants: plants.map((p) => ({
        id: p.id,
        nombreComun: p.nombreComun,
        imageUri: p.imageUri,
      })),
    });
  } catch (error) {
    console.error("Calendar error:", error);
    res.status(500).json({ error: "Failed to get calendar" });
  }
}
