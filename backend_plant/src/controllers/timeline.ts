import { Request, Response } from "express";
import { getFirestore } from "../services/firebase.js";
import { logger } from "../utils/logger.js";

const PLANTS_COLLECTION = "plants";
const TIMELINE_COLLECTION = "timeline_entries";

export async function getTimeline(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const plantDoc = await db.collection(PLANTS_COLLECTION).doc(id).get();

    if (!plantDoc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = plantDoc.data() as { userId: string } | undefined;
    if (!plant || plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const snapshot = await db
      .collection(TIMELINE_COLLECTION)
      .where("plantId", "==", id)
      .orderBy("capturedAt", "desc")
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ entries });
  } catch (error) {
    logger.error(error, "Get timeline error");
    res.status(500).json({ error: "Failed to get timeline" });
  }
}

export async function addTimelineEntry(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;
    const { imageUrl, caption, capturedAt } = req.body as {
      imageUrl: string;
      caption?: string;
      capturedAt: string;
    };

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const plantDoc = await db.collection(PLANTS_COLLECTION).doc(id).get();

    if (!plantDoc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = plantDoc.data() as { userId: string } | undefined;
    if (!plant || plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const entry = {
      plantId: id,
      userId: uid,
      imageUrl,
      caption: caption || "",
      capturedAt: capturedAt || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(TIMELINE_COLLECTION).add(entry);

    res.status(201).json({ id: docRef.id, ...entry });
  } catch (error) {
    logger.error(error, "Add timeline entry error");
    res.status(500).json({ error: "Failed to add timeline entry" });
  }
}

export async function deleteTimelineEntry(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id, entryId } = req.params;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const entryRef = db.collection(TIMELINE_COLLECTION).doc(entryId);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    const entry = entryDoc.data() as { userId: string; plantId: string };
    if (entry.userId !== uid || entry.plantId !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await entryRef.delete();

    res.json({ success: true });
  } catch (error) {
    logger.error(error, "Delete timeline entry error");
    res.status(500).json({ error: "Failed to delete timeline entry" });
  }
}
