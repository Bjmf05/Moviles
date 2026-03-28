import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadPlantImage(
  uri: string,
  userId: string,
): Promise<string> {
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const filename = `${userId}/${Date.now()}.jpg`;

    console.log("📤 Subiendo imagen a Supabase...", filename);

    const { data, error } = await supabase.storage
      .from("plant-images")
      .upload(filename, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log("✅ Imagen subida:", data);

    const { data: urlData } = supabase.storage
      .from("plant-images")
      .getPublicUrl(filename);

    console.log("🔗 URL pública:", urlData.publicUrl);

    return urlData.publicUrl;
  } catch (e) {
    console.error("❌ Error en uploadPlantImage:", e);
    throw e;
  }
}
