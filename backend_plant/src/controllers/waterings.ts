import { Request, Response } from "express";
import { getFirestore } from "../services/firebase.js";

const EVENTS_COLLECTION = "watering_events";

export async function markWatered(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const plantRef = db.collection("plants").doc(id);
    const plantDoc = await plantRef.get();

    if (!plantDoc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = plantDoc.data() as { userId: string; wateringSchedule?: { frequencyDays: number; nextWateringDate: string } };
    if (plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const today = new Date().toISOString();
    const todayDate = today.split("T")[0];

    await db.collection(EVENTS_COLLECTION).add({
      plantId: id,
      userId: uid,
      completedAt: today,
    });

    const freq = plant.wateringSchedule?.frequencyDays || 3;
    const next = new Date();
    next.setDate(next.getDate() + freq);
    const nextDate = next.toISOString().split("T")[0];

    await plantRef.update({
      "wateringSchedule.lastWateredDate": todayDate,
      "wateringSchedule.nextWateringDate": nextDate,
    });

    res.json({ success: true, nextWateringDate: nextDate });
  } catch (error) {
    console.error("Mark watered error:", error);
    res.status(500).json({ error: "Failed to mark watering" });
  }
}

export async function editSchedule(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { frequencyDays, nextWateringDate } = req.body as {
      frequencyDays?: number;
      nextWateringDate?: string;
    };

    const db = getFirestore();
    const plantRef = db.collection("plants").doc(id);
    const plantDoc = await plantRef.get();

    if (!plantDoc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = plantDoc.data() as { userId: string };
    if (plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (frequencyDays !== undefined) updateData["wateringSchedule.frequencyDays"] = frequencyDays;
    if (nextWateringDate !== undefined) updateData["wateringSchedule.nextWateringDate"] = nextWateringDate;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    await plantRef.update(updateData);

    res.json({ success: true });
  } catch (error) {
    console.error("Edit schedule error:", error);
    res.status(500).json({ error: "Failed to edit schedule" });
  }
}
