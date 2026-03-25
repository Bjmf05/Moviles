import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadPlantImage(
  uri: string,
  userId: string,
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("plant-images")
    .upload(filename, blob, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("plant-images").getPublicUrl(filename);

  return data.publicUrl;
}
