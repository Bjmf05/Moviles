import { Request, Response } from "express";
import { getFirestore } from "../services/firebase.js";
import { uploadUserImage, deleteUserImage } from "../services/supabase.js";
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";

const PLANTS_COLLECTION = "plants";

interface PlantCare {
  riego: string;
  luz: string;
  temperatura: string;
}

interface Toxicity {
  esToxica: boolean;
  detalle: string;
}

interface Plant {
  userId: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: PlantCare;
  toxicidad: Toxicity;
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
    } = req.body as CreatePlantBody;

    if (!nombreComun || !nombreCientifico) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const db = getFirestore();
    const plantData: Plant = {
      userId: uid,
      nombreComun,
      nombreCientifico,
      descripcion: descripcion || "",
      cuidados: cuidados || { riego: "", luz: "", temperatura: "" },
      toxicidad: toxicidad || { esToxica: false, detalle: "" },
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

    const updateData: Partial<Plant> = {};
    if (updates.nombreComun !== undefined) updateData.nombreComun = updates.nombreComun;
    if (updates.nombreCientifico !== undefined) updateData.nombreCientifico = updates.nombreCientifico;
    if (updates.descripcion !== undefined) updateData.descripcion = updates.descripcion;
    if (updates.cuidados !== undefined) updateData.cuidados = updates.cuidados;
    if (updates.toxicidad !== undefined) updateData.toxicidad = updates.toxicidad;
    if (updates.imageUri !== undefined) updateData.imageUri = updates.imageUri;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

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