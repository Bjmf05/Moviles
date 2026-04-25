import { useAuth } from "../context/AuthContext";
import { api, Plant } from "./api";

export { api };
export type { Plant as SavedPlant };

export function usePlants() {
  const { token } = useAuth();

  const savePlant = async (plant: Omit<Plant, "id" | "userId" | "savedAt">) => {
    if (!token) throw new Error("Not authenticated");
    return api.plants.create(token, plant);
  };

  const getUserPlants = async (): Promise<Plant[]> => {
    if (!token) throw new Error("Not authenticated");
    const { plants } = await api.plants.getAll(token);
    return plants;
  };

  const updatePlantNotes = async (plantId: string, notes: string) => {
    if (!token) throw new Error("Not authenticated");
    return api.plants.update(token, plantId, { notes });
  };

  const deletePlant = async (plantId: string) => {
    if (!token) throw new Error("Not authenticated");
    return api.plants.delete(token, plantId);
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