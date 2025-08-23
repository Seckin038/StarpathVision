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
  const path = `${cardId}.${ext}`;
  // Upload the file, overwriting if it exists. Set a short cache time.
  const { error } = await supabase.storage.from("tarot-cards").upload(path, file, {
    cacheControl: "60", // Cache for 60 seconds
    upsert: true,
  });
  if (error) throw error;

  // Get the public URL
  const { data } = supabase.storage.from("tarot-cards").getPublicUrl(path);
  
  // Add a cache-busting query parameter to ensure the new image is always fetched
  const urlWithCacheBuster = `${data.publicUrl}?t=${new Date().getTime()}`;
  
  return urlWithCacheBuster;
}