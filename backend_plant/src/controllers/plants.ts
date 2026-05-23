import { Request, Response } from "express";
import { getFirestore } from "../services/firebase.js";
import { deleteUserImage } from "../services/supabase.js";
import { logger } from "../utils/logger.js";

const PLANTS_COLLECTION = "plants";

function parseWateringFrequency(riego: string): number {
  const match = riego.match(/Cada\s+(\d+)\s+días?/i);
  if (match) return parseInt(match[1], 10);
  const lower = riego.toLowerCase();
  if (lower.includes("frecuente")) return 2;
  if (lower.includes("escaso") || lower.includes("poco")) return 7;
  if (lower.includes("moderado") || lower.includes("normal")) return 3;
  return 3;
}

function calcNextWatering(frequencyDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + frequencyDays);
  return d.toISOString().split("T")[0];
}

interface PlantCare {
  riego: string;
  luz: string;
  temperatura: string;
}

interface Toxicity {
  esToxica: boolean;
  detalle: string;
}

interface WateringSchedule {
  frequencyDays: number;
  nextWateringDate: string;
  lastWateredDate: string | null;
}

interface Plant {
  userId: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: PlantCare;
  toxicidad: Toxicity;
  wateringSchedule: WateringSchedule;
  imageUri?: string;
  notes?: string;
  savedAt?: string;
  isPublic: boolean;
  ownerName: string;
  ownerPhoto: string;
}

interface CreatePlantBody {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: PlantCare;
  toxicidad: Toxicity;
  imageUri?: string;
  frequencyDays?: number;
  isPublic?: boolean;
}

interface UpdatePlantBody {
  nombreComun?: string;
  nombreCientifico?: string;
  descripcion?: string;
  cuidados?: PlantCare;
  toxicidad?: Toxicity;
  imageUri?: string;
  notes?: string;
  isPublic?: boolean;
}

export async function createPlant(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      nombreComun,
      nombreCientifico,
      descripcion,
      cuidados,
      toxicidad,
      imageUri,
      frequencyDays,
      isPublic = false,
    } = req.body as CreatePlantBody;

    if (!nombreComun || !nombreCientifico) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const freq = frequencyDays || parseWateringFrequency(cuidados?.riego || "");

    const db = getFirestore();

    // Fetch owner photo from user profile
    let ownerPhoto = "";
    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        ownerPhoto = (userData?.imageUri as string) || "";
      }
    } catch {
      // ignore
    }

    const plantData: Plant = {
      userId: uid,
      nombreComun,
      nombreCientifico,
      descripcion: descripcion || "",
      cuidados: cuidados || { riego: "", luz: "", temperatura: "" },
      toxicidad: toxicidad || { esToxica: false, detalle: "" },
      wateringSchedule: {
        frequencyDays: freq,
        nextWateringDate: calcNextWatering(freq),
        lastWateredDate: null,
      },
      imageUri: imageUri || "",
      notes: "",
      savedAt: new Date().toISOString(),
      isPublic,
      ownerName: req.user?.name || "",
      ownerPhoto,
    };

    const docRef = await db.collection(PLANTS_COLLECTION).add(plantData);

    res.status(201).json({
      id: docRef.id,
      ...plantData,
    });
  } catch (error) {
    logger.error(error, "Create plant error");
    res.status(500).json({ error: "Failed to create plant" });
  }
}

export async function getPlants(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const snapshot = await db
      .collection(PLANTS_COLLECTION)
      .where("userId", "==", uid)
      .orderBy("savedAt", "desc")
      .get();

    const plants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ plants });
  } catch (error) {
    logger.error(error, "Get plants error");
    res.status(500).json({ error: "Failed to get plants" });
  }
}

export async function getPlant(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const doc = await db.collection(PLANTS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = doc.data() as Plant;

    if (plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ id: doc.id, ...plant });
  } catch (error) {
    logger.error(error, "Get plant error");
    res.status(500).json({ error: "Failed to get plant" });
  }
}

export async function updatePlant(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;
    const updates = req.body as UpdatePlantBody;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const docRef = db.collection(PLANTS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = doc.data() as Plant;

    if (plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (updates.nombreComun !== undefined)
      updateData.nombreComun = updates.nombreComun;
    if (updates.nombreCientifico !== undefined)
      updateData.nombreCientifico = updates.nombreCientifico;
    if (updates.descripcion !== undefined)
      updateData.descripcion = updates.descripcion;
    if (updates.cuidados !== undefined) updateData.cuidados = updates.cuidados;
    if (updates.toxicidad !== undefined)
      updateData.toxicidad = updates.toxicidad;
    if (updates.imageUri !== undefined) updateData.imageUri = updates.imageUri;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isPublic !== undefined)
      updateData.isPublic = updates.isPublic;

    if (
      updates.cuidados?.riego !== undefined &&
      updates.cuidados.riego !== plant.cuidados.riego
    ) {
      const freq = parseWateringFrequency(updates.cuidados.riego);
      updateData["wateringSchedule.frequencyDays"] = freq;
      updateData["wateringSchedule.nextWateringDate"] = calcNextWatering(freq);
    }

    await docRef.update(updateData);

    res.json({ success: true });
  } catch (error) {
    logger.error(error, "Update plant error");
    res.status(500).json({ error: "Failed to update plant" });
  }
}

export async function getExplorePlants(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const cursor = req.query.cursor as string | undefined;
    const search = (req.query.search as string || "").toLowerCase().trim();
    const luz = req.query.luz as string | undefined;
    const riego = req.query.riego as string | undefined;
    const toxica = req.query.toxica as string | undefined;

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection(PLANTS_COLLECTION)
      .where("isPublic", "==", true)
      .orderBy("savedAt", "desc")
      .limit(limit + 1);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    let plants: Record<string, unknown>[] = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter in-memory
    if (search) {
      plants = plants.filter(
        (p) =>
          ((p.nombreComun as string) || "")
            .toLowerCase()
            .includes(search) ||
          ((p.nombreCientifico as string) || "")
            .toLowerCase()
            .includes(search),
      );
    }

    // Apply luz filter
    if (luz) {
      const luzLower = luz.toLowerCase();
      plants = plants.filter((p) => {
        const cuidados = p.cuidados as PlantCare | undefined;
        return (cuidados?.luz || "").toLowerCase().includes(luzLower);
      });
    }

    // Apply riego filter
    if (riego) {
      const riegoLower = riego.toLowerCase();
      plants = plants.filter((p) => {
        const cuidados = p.cuidados as PlantCare | undefined;
        return (cuidados?.riego || "").toLowerCase().includes(riegoLower);
      });
    }

    // Apply toxica filter
    if (toxica === "true") {
      plants = plants.filter((p) => {
        const tox = p.toxicidad as Toxicity | undefined;
        return tox?.esToxica === true;
      });
    } else if (toxica === "false") {
      plants = plants.filter((p) => {
        const tox = p.toxicidad as Toxicity | undefined;
        return tox?.esToxica === false;
      });
    }

    const nextCursor =
      hasMore && docs.length > 0
        ? (docs[docs.length - 1].data() as Plant).savedAt
        : null;

    res.json({
      plants,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    logger.error(error, "Get explore plants error");
    const message =
      error instanceof Error ? error.message : "Failed to get explore plants";
    res.status(500).json({ error: message });
  }
}

export async function getExplorePlant(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const db = getFirestore();
    const doc = await db.collection(PLANTS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = doc.data() as Plant;

    if (!plant.isPublic) {
      res.status(403).json({ error: "This plant is not public" });
      return;
    }

    res.json({ id: doc.id, ...plant });
  } catch (error) {
    logger.error(error, "Get explore plant error");
    res.status(500).json({ error: "Failed to get plant" });
  }
}

export async function deletePlant(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getFirestore();
    const docRef = db.collection(PLANTS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: "Plant not found" });
      return;
    }

    const plant = doc.data() as Plant;

    if (plant.userId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Delete associated image if exists
    if (plant.imageUri) {
      try {
        await deleteUserImage(plant.imageUri);
      } catch (e) {
        logger.error(e, "Failed to delete image");
      }
    }

    // Delete timeline entries and their images
    const TIMELINE_COLLECTION = "timeline_entries";
    const timelineSnapshot = await db
      .collection(TIMELINE_COLLECTION)
      .where("plantId", "==", id)
      .get();

    if (!timelineSnapshot.empty) {
      // Delete all timeline images from Supabase
      for (const tDoc of timelineSnapshot.docs) {
        const entry = tDoc.data() as { imageUrl?: string } | undefined;
        if (entry?.imageUrl) {
          try {
            await deleteUserImage(entry.imageUrl);
          } catch (e) {
            logger.error(e, "Failed to delete timeline image");
          }
        }
      }

      // Batch delete all timeline entries
      const batch = db.batch();
      timelineSnapshot.docs.forEach((tDoc) => batch.delete(tDoc.ref));
      await batch.commit();
    }

    await docRef.delete();

    res.json({ success: true, message: "Plant deleted" });
  } catch (error) {
    logger.error(error, "Delete plant error");
    res.status(500).json({ error: "Failed to delete plant" });
  }
}
