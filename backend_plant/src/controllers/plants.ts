import { Request, Response } from "express";
import { getFirestore } from "../services/firebase.js";
import { deleteUserImage } from "../services/supabase.js";

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
}

interface CreatePlantBody {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: PlantCare;
  toxicidad: Toxicity;
  imageUri?: string;
  frequencyDays?: number;
}

interface UpdatePlantBody {
  nombreComun?: string;
  nombreCientifico?: string;
  descripcion?: string;
  cuidados?: PlantCare;
  toxicidad?: Toxicity;
  imageUri?: string;
  notes?: string;
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
    } = req.body as CreatePlantBody;

    if (!nombreComun || !nombreCientifico) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const freq = frequencyDays || parseWateringFrequency(cuidados?.riego || "");

    const db = getFirestore();
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
    };

    const docRef = await db.collection(PLANTS_COLLECTION).add(plantData);

    res.status(201).json({
      id: docRef.id,
      ...plantData,
    });
  } catch (error) {
    console.error("Create plant error:", error);
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
    console.error("Get plants error:", error);
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
    console.error("Get plant error:", error);
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
    if (updates.nombreComun !== undefined) updateData.nombreComun = updates.nombreComun;
    if (updates.nombreCientifico !== undefined) updateData.nombreCientifico = updates.nombreCientifico;
    if (updates.descripcion !== undefined) updateData.descripcion = updates.descripcion;
    if (updates.cuidados !== undefined) updateData.cuidados = updates.cuidados;
    if (updates.toxicidad !== undefined) updateData.toxicidad = updates.toxicidad;
    if (updates.imageUri !== undefined) updateData.imageUri = updates.imageUri;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    if (updates.cuidados?.riego !== undefined && updates.cuidados.riego !== plant.cuidados.riego) {
      const freq = parseWateringFrequency(updates.cuidados.riego);
      updateData["wateringSchedule.frequencyDays"] = freq;
      updateData["wateringSchedule.nextWateringDate"] = calcNextWatering(freq);
    }

    await docRef.update(updateData);

    res.json({ success: true });
  } catch (error) {
    console.error("Update plant error:", error);
    res.status(500).json({ error: "Failed to update plant" });
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
        console.error("Failed to delete image:", e);
      }
    }

    await docRef.delete();

    res.json({ success: true, message: "Plant deleted" });
  } catch (error) {
    console.error("Delete plant error:", error);
    res.status(500).json({ error: "Failed to delete plant" });
  }
}