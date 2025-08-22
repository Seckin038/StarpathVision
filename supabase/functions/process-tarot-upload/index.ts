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

// Explicitly get env vars at the top level to ensure they exist on startup.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
if (!SUPABASE_URL) throw new Error("FATAL: Missing env var: SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("FATAL: Missing env var: SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
if (!GEMINI_API_KEY) throw new Error("FATAL: Missing env var: GEMINI_API_KEY");


async function identifyByAI(bytes: Uint8Array, mime: string): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const b64 = encode(bytes);
  const res = await model.generateContent([
    PROMPT,
    { inlineData: { data: b64, mimeType: mime || "image/jpeg" } },
  ]);
  const text = res?.response?.text?.()?.trim() || null;
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    if (!filePath) throw new Error("filePath is required");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Download the uploaded image
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from("tarot-card-uploads")
      .download(filePath);
    if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

    // 2. Identify the card using AI
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const cardNameEn = await identifyByAI(bytes, blob.type);
    if (!cardNameEn) throw new Error("AI could not identify the card.");
    
    // 3. Find the corresponding card in the database
    const { data: matchedCard, error: findError } = await supabaseAdmin
      .from('tarot_cards')
      .select('id')
      .ilike('name->>en', cardNameEn)
      .single();
    if (findError || !matchedCard) {
      throw new Error(`Card '${cardNameEn}' not found in database. ${findError?.message || ''}`);
    }
    const cardId = matchedCard.id;

    // 4. Upload the image to the final public bucket
    const ext = filePath.split(".").pop() || "jpg";
    const finalPath = `${cardId}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("tarot-cards")
      .upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (uploadError) throw new Error(`Final upload failed: ${uploadError.message}`);

    // 5. Update the image_url in the database
    const { data: urlData } = supabaseAdmin.storage.from("tarot-cards").getPublicUrl(finalPath);
    const { error: updateError } = await supabaseAdmin
      .from("tarot_cards")
      .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", cardId);
    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

    // 6. Clean up the temporary file
    await supabaseAdmin.storage.from("tarot-card-uploads").remove([filePath]);

    return new Response(JSON.stringify({ success: true, cardId: cardId, imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("CRITICAL ERROR in function:", msg);
    return new Response(JSON.stringify({ error: `A critical error occurred in the Edge Function: ${msg}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});