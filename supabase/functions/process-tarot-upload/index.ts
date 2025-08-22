// @ts-nocheck
// Deno Edge Function
// supabase/functions/process-tarot-upload/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const PROMPT = `
You are an expert in Rider–Waite–Smith tarot identification.
Return ONLY the official English card name (e.g., "The Fool", "Ace of Wands", "Judgement").
If you see "Coins" -> Pentacles; "Rods"/"Staves" -> Wands.
No extra words.
`;

// Reflect exact headers the browser requests (preflight-safe).
function cors(req: Request) {
  const origin = req.headers.get("Origin") ?? "*";
  const reqHdrs = req.headers.get("Access-Control-Request-Headers")
    ?? "authorization, x-client-info, apikey, content-type, x-supabase-authorization";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": reqHdrs,
    "Access-Control-Max-Age": "86400",
  };
}

async function identifyWithGemini(bytes: Uint8Array, mime: string, apiKey: string) {
  const b64 = encode(bytes);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [
        { text: PROMPT.trim() },
        { inline_data: { mime_type: mime || "image/jpeg", data: b64 } },
      ],
    }],
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  return text;
}

Deno.serve(async (req) => {
  const corsHeaders = cors(req);

  // Always answer preflight so the browser will proceed to POST.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.ping) {
      return new Response(JSON.stringify({ pong: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read env inside the handler (no top-level throws).
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const GEMINI_KEY   = Deno.env.get("GEMINI_API_KEY") ?? "";

    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    if (!body?.filePath) throw new Error("filePath is required");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) download temp upload
    const { data: blob, error: dlErr } = await sb.storage
      .from("tarot-card-uploads")
      .download(body.filePath);
    if (dlErr) throw new Error(`Download failed: ${dlErr.message}`);

    // 2) AI identify (with graceful fallback if GEMINI_KEY absent)
    let cardNameEn: string | null = null;
    if (GEMINI_KEY) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      cardNameEn = await identifyWithGemini(bytes, blob.type, GEMINI_KEY);
    }
    if (!cardNameEn) {
      // Fallback: try from filename like "major_arcana_chariot.png" -> "The Chariot"
      const base = body.filePath.split("/").pop() || "";
      const guess = base.replace(/[_-]/g, " ").replace(/\.[^.]+$/, "").trim();
      if (guess) cardNameEn = guess; // DB lookup will validate or fail below
    }

    // 3) find card id
    const { data: card, error: findErr } = await sb
      .from("tarot_cards")
      .select("id")
      .ilike("name->>en", cardNameEn!)
      .single();
    if (findErr || !card) throw new Error(`Card '${cardNameEn}' not found`);

    const cardId = card.id;
    const ext = (body.filePath.split(".").pop() || "jpg").toLowerCase();
    const finalPath = `${cardId}.${ext}`;

    // 4) upsert to final bucket
    const { error: upErr } = await sb.storage
      .from("tarot-cards")
      .upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (upErr) throw new Error(`Final upload failed: ${upErr.message}`);

    // 5) public URL + DB update
    const { data: urlData } = sb.storage.from("tarot-cards").getPublicUrl(finalPath);
    const { error: updErr } = await sb
      .from("tarot_cards")
      .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", cardId);
    if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

    // 6) cleanup temp
    await sb.storage.from("tarot-card-uploads").remove([body.filePath]);

    return new Response(JSON.stringify({ success: true, cardId, imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});