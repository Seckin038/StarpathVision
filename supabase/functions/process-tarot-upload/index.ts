// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT = `
You are an expert in Rider–Waite–Smith tarot identification.
Return ONLY the official English card name, no extra words.
Examples: "The Fool", "Ace of Wands", "Ten of Pentacles", "Judgement".
If you see "Coins" assume "Pentacles". If you see "Rods/Staves" assume "Wands".
`;

const RWS_EN_TO_NL = {
  "The Fool": "De Dwaas", "The Magician": "De Magiër", "The High Priestess": "De Hogepriesteres", "The Empress": "De Keizerin", "The Emperor": "De Keizer", "The Hierophant": "De Hiërofant", "The Lovers": "De Geliefden", "The Chariot": "De Zegewagen", "Strength": "Kracht", "The Hermit": "De Kluizenaar", "Wheel of Fortune": "Het Rad van Fortuin", "Justice": "Gerechtigheid", "The Hanged Man": "De Gehangene", "Death": "De Dood", "Temperance": "Gematigdheid", "The Devil": "De Duivel", "The Tower": "De Toren", "The Star": "De Ster", "The Moon": "De Maan", "The Sun": "De Zon", "Judgement": "Het Oordeel", "The World": "De Wereld",
  "Ace of Wands": "Aas van Staven", "Two of Wands": "Twee van Staven", "Three of Wands": "Drie van Staven", "Four of Wands": "Vier van Staven", "Five of Wands": "Vijf van Staven", "Six of Wands": "Zes van Staven", "Seven of Wands": "Zeven van Staven", "Eight of Wands": "Acht van Staven", "Nine of Wands": "Negen van Staven", "Ten of Wands": "Tien van Staven", "Page of Wands": "Page van Staven", "Knight of Wands": "Ridder van Staven", "Queen of Wands": "Koningin van Staven", "King of Wands": "Koning van Staven",
  "Ace of Cups": "Aas van Kelken", "Two of Cups": "Twee van Kelken", "Three of Cups": "Drie van Kelken", "Four of Cups": "Vier van Kelken", "Five of Cups": "Vijf van Kelken", "Six of Cups": "Zes van Kelken", "Seven of Cups": "Zeven van Kelken", "Eight of Cups": "Acht van Kelken", "Nine of Cups": "Negen van Kelken", "Ten of Cups": "Tien van Kelken", "Page of Cups": "Page van Kelken", "Knight of Cups": "Ridder van Kelken", "Queen of Cups": "Koningin van Kelken", "King of Cups": "Koning van Kelken",
  "Ace of Swords": "Aas van Zwaarden", "Two of Swords": "Twee van Zwaarden", "Three of Swords": "Drie van Zwaarden", "Four of Swords": "Vier van Zwaarden", "Five of Swords": "Vijf van Zwaarden", "Six of Swords": "Zes van Zwaarden", "Seven of Swords": "Zeven van Zwaarden", "Eight of Swords": "Acht van Zwaarden", "Nine of Swords": "Negen van Zwaarden", "Ten of Swords": "Tien van Zwaarden", "Page of Swords": "Page van Zwaarden", "Knight of Swords": "Ridder van Zwaarden", "Queen of Swords": "Koningin van Zwaarden", "King of Swords": "Koning van Zwaarden",
  "Ace of Pentacles": "Aas van Pentakels", "Two of Pentacles": "Twee van Pentakels", "Three of Pentacles": "Drie van Pentakels", "Four of Pentacles": "Vier van Pentakels", "Five of Pentacles": "Vijf van Pentakels", "Six of Pentacles": "Zes van Pentakels", "Seven of Pentacles": "Zeven van Pentakels", "Eight of Pentacles": "Acht van Pentakels", "Nine of Pentacles": "Negen van Pentakels", "Ten of Pentacles": "Tien van Pentakels", "Page of Pentacles": "Page van Pentakels", "Knight of Pentacles": "Ridder van Pentakels", "Queen of Pentacles": "Koningin van Pentakels", "King of Pentacles": "Koning van Pentakels"
};

function env(key: string) {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

async function identifyByAI(bytes: Uint8Array, mime: string): Promise<string | null> {
  const key = env("GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const b64 = encode(bytes);
  const res = await model.generateContent([
    PROMPT,
    { inlineData: { data: b64, mimeType: mime || "image/jpeg" } },
  ]);
  return res?.response?.text?.()?.trim() || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    if (!filePath) throw new Error("filePath is required");

    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    // 1. Download the file from the temporary bucket
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from("tarot-card-uploads")
      .download(filePath);
    if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

    // 2. Identify the card using AI
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const cardNameEn = await identifyByAI(bytes, blob.type);
    if (!cardNameEn) throw new Error("AI could not identify the card.");
    
    const cardNameNl = RWS_EN_TO_NL[cardNameEn];
    if (!cardNameNl) throw new Error(`Could not map English name '${cardNameEn}' to Dutch.`);

    // 3. Find the card in the database
    const { data: card, error: dbError } = await supabaseAdmin
      .from("tarot_cards")
      .select("id, name")
      .eq("name", cardNameNl)
      .single();
    if (dbError) throw new Error(`Card '${cardNameNl}' not found in database.`);

    // 4. Upload the image to the final bucket with the correct ID
    const ext = filePath.split(".").pop() || "jpg";
    const finalPath = `${card.id}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("tarot-cards")
      .upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (uploadError) throw new Error(`Final upload failed: ${uploadError.message}`);

    // 5. Get public URL and update the database
    const { data: urlData } = supabaseAdmin.storage.from("tarot-cards").getPublicUrl(finalPath);
    const { error: updateError } = await supabaseAdmin
      .from("tarot_cards")
      .update({ image_url: urlData.publicUrl })
      .eq("id", card.id);
    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

    // 6. Clean up the temporary file
    await supabaseAdmin.storage.from("tarot-card-uploads").remove([filePath]);

    return new Response(JSON.stringify({ success: true, cardName: card.name, imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});