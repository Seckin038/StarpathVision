// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT = `
You are an expert in Rider–Waite–Smith tarot identification.
Your task is to identify the tarot card from the provided image.
Return ONLY the official English card name, and nothing else.
Examples of valid responses: "The Fool", "Ace of Wands", "Ten of Pentacles", "Judgement".
If you see "Coins", interpret it as "Pentacles". If you see "Rods" or "Staves", interpret it as "Wands".
Do not add any extra words, punctuation, or explanations.
`;

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
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
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    if (!filePath) throw new Error("filePath is required");

    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    // 1. Download the uploaded image
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from("tarot-card-uploads")
      .download(filePath);
    if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

    // 2. Identify the card using AI
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const cardNameEn = await identifyByAI(bytes, blob.type);
    if (!cardNameEn) throw new Error("AI could not identify the card.");
    
    // 3. Find the corresponding card in the database using its English name
    const { data: matchedCard, error: findError } = await supabaseAdmin
      .from('tarot_cards')
      .select('id')
      .ilike('name->>en', cardNameEn)
      .single();

    if (findError || !matchedCard) {
      throw new Error(`Card '${cardNameEn}' not found in database. ${findError?.message || ''}`);
    }

    // 4. Use the ID from the matched card to update the correct record
    const cardId = matchedCard.id;

    // 5. Upload the image to the final public bucket
    const ext = filePath.split(".").pop() || "jpg";
    const finalPath = `${cardId}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("tarot-cards")
      .upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (uploadError) throw new Error(`Final upload failed: ${uploadError.message}`);

    // 6. Update the image_url in the database
    const { data: urlData } = supabaseAdmin.storage.from("tarot-cards").getPublicUrl(finalPath);
    const { error: updateError } = await supabaseAdmin
      .from("tarot_cards")
      .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", cardId);
    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

    // 7. Clean up the temporary file
    await supabaseAdmin.storage.from("tarot-card-uploads").remove([filePath]);

    return new Response(JSON.stringify({ success: true, cardId: cardId, imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("process-tarot-upload error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});