import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "../config/index.js";

let supabase: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const cfg = getConfig();
  supabase = createClient(cfg.supabase.url, cfg.supabase.anonKey);

  return supabase;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) throw new Error("Supabase not initialized");
  return supabase;
}

export async function uploadUserImage(
  userId: string,
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const client = getSupabaseClient();
  const cfg = getConfig();
  const path = `${userId}/${Date.now()}-${filename}`;

  const { error } = await client.storage
    .from(cfg.supabase.bucketName)
    .upload(path, fileBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = client.storage
    .from(cfg.supabase.bucketName)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteUserImage(imageUrl: string): Promise<void> {
  const client = getSupabaseClient();
  const cfg = getConfig();
  
  // Extract path from URL
  const urlParts = imageUrl.split("/storage/v1/object/public/");
  if (urlParts.length < 2) return;
  
  const path = urlParts[1];
  
  const { error } = await client.storage
    .from(cfg.supabase.bucketName)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}