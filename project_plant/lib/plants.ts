import { useAuth } from "../context/AuthContext";
import { api, Plant } from "./api";
import {
  cachePlants,
  getCachedPlants,
  cacheAllPlantImages,
  removeCachedPlant,
  removeCachedTimelineImages,
} from "./localCache";

export { api };
export type { Plant as SavedPlant };

export function usePlants() {
  const { token } = useAuth();

  const savePlant = async (plant: Omit<Plant, "id" | "userId" | "savedAt">) => {
    if (!token) throw new Error("Not authenticated");
    return api.plants.create(token, plant);
  };

  const getUserPlants = async (): Promise<{
    plants: Plant[];
    fromCache: boolean;
  }> => {
    if (!token) throw new Error("Not authenticated");
    try {
      const result = await api.plants.getAll(token);
      const plants = result.plants;
      cachePlants(plants);
      cacheAllPlantImages(plants);
      return { plants, fromCache: false };
    } catch {
      const cached = await getCachedPlants();
      if (cached.length > 0) {
        return { plants: cached, fromCache: true };
      }
      throw new Error(
        "No hay datos guardados localmente. Conectate a internet para cargar tu jardin.",
      );
    }
  };

  const updatePlantNotes = async (plantId: string, notes: string) => {
    if (!token) throw new Error("Not authenticated");
    return api.plants.update(token, plantId, { notes });
  };

  const deletePlant = async (plantId: string) => {
    if (!token) throw new Error("Not authenticated");
    const result = await api.plants.delete(token, plantId);
    await removeCachedPlant(plantId);
    await removeCachedTimelineImages();
    return result;
  };

  const uploadImage = async (uri: string): Promise<string> => {
    if (!token) throw new Error("Not authenticated");
    return api.images.upload(token, uri);
  };

  return {
    savePlant,
    getUserPlants,
    updatePlantNotes,
    deletePlant,
    uploadImage,
  };
}