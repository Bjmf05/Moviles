import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Plant } from "./api";

const PLANTS_CACHE_KEY = "@plants_cache";
const IMAGES_DIR = `${FileSystem.documentDirectory}plants/`;

export async function cachePlants(plants: Plant[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(plants));
  } catch (e) {
    console.error("Failed to cache plants:", e);
  }
}

export async function getCachedPlants(): Promise<Plant[]> {
  try {
    const data = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function cacheImage(
  remoteUri: string,
  plantId: string,
): Promise<string | null> {
  try {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    const localPath = `${IMAGES_DIR}${plantId}.jpg`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
    const result = await FileSystem.downloadAsync(remoteUri, localPath);
    return result.uri;
  } catch {
    return null;
  }
}

export async function getLocalImagePath(
  plantId: string,
): Promise<string | null> {
  try {
    const localPath = `${IMAGES_DIR}${plantId}.jpg`;
    const info = await FileSystem.getInfoAsync(localPath);
    return info.exists ? localPath : null;
  } catch {
    return null;
  }
}

export async function cacheAllPlantImages(plants: Plant[]): Promise<void> {
  try {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    const results = await Promise.allSettled(
      plants
        .filter((p) => p.imageUri)
        .map((p) => cacheImage(p.imageUri!, p.id)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) console.warn(`Failed to cache ${failed} images`);
  } catch {}
}

export async function resolveLocalImageMap(
  plants: Plant[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    plants.map(async (p) => {
      const local = await getLocalImagePath(p.id);
      return local ? ([p.id, local] as const) : null;
    }),
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => e !== null));
}

export async function removeCachedPlant(plantId: string): Promise<void> {
  try {
    const plants = await getCachedPlants();
    await cachePlants(plants.filter((p) => p.id !== plantId));
    await FileSystem.deleteAsync(`${IMAGES_DIR}${plantId}.jpg`, {
      idempotent: true,
    });
  } catch {}
}

export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PLANTS_CACHE_KEY);
    await FileSystem.deleteAsync(IMAGES_DIR, { idempotent: true });
  } catch {}
}

export async function hasCachedData(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
    return !!data && data !== "[]";
  } catch {
    return false;
  }
}
