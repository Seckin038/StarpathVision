import { supabase } from "@/lib/supabaseClient";

export async function uploadAvatar(file: File, userId: string) {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3660",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadTarotCardImage(file: File, cardId: string) {
  const ext = file.name.split(".").pop() || "png";
  const path = `${cardId}.${ext}`; // Use card ID for a clean filename, e.g., maj01.png
  const { error } = await supabase.storage.from("tarot-cards").upload(path, file, {
    cacheControl: "31536000", // Cache for 1 year
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("tarot-cards").getPublicUrl(path);
  return data.publicUrl;
}