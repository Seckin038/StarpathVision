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
  console.log("Step 2a: Initializing Gemini AI client.");
  const key = env("GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const b64 = encode(bytes);
  console.log("Step 2b: Sending request to Gemini AI.");
  const res = await model.generateContent([
    PROMPT,
    { inlineData: { data: b64, mimeType: mime || "image/jpeg" } },
  ]);
  const text = res?.response?.text?.()?.trim() || null;
  console.log(`Step 2c: Received response from AI: "${text}"`);
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log("Function invoked.");
    const { filePath } = await req.json();
    if (!filePath) throw new Error("filePath is required");
    console.log(`Payload valid, filePath: ${filePath}`);

    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    console.log("Supabase admin client created.");

    // 1. Download the uploaded image
    console.log("Step 1: Downloading file from temp storage...");
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from("tarot-card-uploads")
      .download(filePath);
    if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);
    console.log(`Step 1: Download successful. Blob size: ${blob.size}`);

    // 2. Identify the card using AI
    console.log("Step 2: Identifying card with AI...");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const cardNameEn = await identifyByAI(bytes, blob.type);
    if (!cardNameEn) throw new Error("AI could not identify the card.");
    console.log(`Step 2: AI identification successful. Card: ${cardNameEn}`);
    
    // 3. Find the corresponding card in the database
    console.log("Step 3: Finding card in database...");
    const { data: matchedCard, error: findError } = await supabaseAdmin
      .from('tarot_cards')
      .select('id')
      .ilike('name->>en', cardNameEn)
      .single();
    if (findError || !matchedCard) {
      throw new Error(`Card '${cardNameEn}' not found in database. ${findError?.message || ''}`);
    }
    const cardId = matchedCard.id;
    console.log(`Step 3: Card found. ID: ${cardId}`);

    // 4. Upload the image to the final public bucket
    console.log("Step 4: Uploading image to final destination...");
    const ext = filePath.split(".").pop() || "jpg";
    const finalPath = `${cardId}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("tarot-cards")
      .upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (uploadError) throw new Error(`Final upload failed: ${uploadError.message}`);
    console.log(`Step 4: Final upload successful. Path: ${finalPath}`);

    // 5. Update the image_url in the database
    console.log("Step 5: Updating database record...");
    const { data: urlData } = supabaseAdmin.storage.from("tarot-cards").getPublicUrl(finalPath);
    const { error: updateError } = await supabaseAdmin
      .from("tarot_cards")
      .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", cardId);
    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);
    console.log("Step 5: Database update successful.");

    // 6. Clean up the temporary file
    console.log("Step 6: Cleaning up temporary file...");
    await supabaseAdmin.storage.from("tarot-card-uploads").remove([filePath]);
    console.log("Step 6: Cleanup successful.");

    console.log("Function finished successfully.");
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