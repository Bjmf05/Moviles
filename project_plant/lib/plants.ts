import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { uploadPlantImage } from "./supabase"; // ← viene de supabase ahora

export type SavedPlant = {
  id?: string;
  userId: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: { riego: string; luz: string; temperatura: string };
  toxicidad: { esToxica: boolean; detalle: string };
  imageUri: string;
  notes: string;
  savedAt: string;
};

export { uploadPlantImage }; // re-exportar para usarlo en camera.tsx

export async function savePlant(plant: Omit<SavedPlant, "id">) {
  return addDoc(collection(db, "plants"), plant);
}

export async function getUserPlants(userId: string): Promise<SavedPlant[]> {
  const q = query(
    collection(db, "plants"),
    where("userId", "==", userId),
    orderBy("savedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedPlant);
}

export async function updatePlantNotes(plantId: string, notes: string) {
  await updateDoc(doc(db, "plants", plantId), { notes });
}

export async function deletePlant(plantId: string) {
  await deleteDoc(doc(db, "plants", plantId));
}
