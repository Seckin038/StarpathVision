// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// AI function is kept, but will not be called in this version.
async function aiIdentify(bytes: Uint8Array, mime: string, key?: string){
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
  const prompt = `Return ONLY the official English tarot card name (e.g., "The Fool", "Ace of Wands", "Judgement"). If you see Coins→Pentacles; Rods/Staves→Wands.`;
  const body = {
    contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: mime||"image/jpeg", data: encode(bytes) } } ] }]
  };
  const r = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`AI HTTP ${r.status}`);
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return new Response(JSON.stringify({error:"METHOD"}), { status:405, headers:{...corsHeaders, "Content-Type":"application/json"} });

    const { path, originalFilename } = await req.json().catch(()=>({}));
    if (!path) throw new Error("'path' is required (temp storage path)");

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GEMINI_KEY  = Deno.env.get('GEMINI_API_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE key");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const tmpBucket = 'tarot-card-uploads';
    const dl = await sb.storage.from(tmpBucket).download(path);
    if (dl.error) throw new Error(`Download failed: ${dl.error.message}`);
    const blob = dl.data;
    
    let nameEn: string | null = null;

    // --- AI IDENTIFICATION IS TEMPORARILY DISABLED FOR DIAGNOSTICS ---
    console.log("AI identification is temporarily disabled. Falling back to filename.");
    const filenameToParse = originalFilename || path;
    const base = (filenameToParse.split('/').pop()||'').replace(/[_-]+/g,' ').replace(/\.[^.]+$/, '').trim();
    nameEn = base.replace(/^\d+\s*/, '').replace(/([A-Z])/g, ' $1').trim();
    console.log(`Fallback identified card as: ${nameEn}`);
    
    if (!nameEn) {
        throw new Error("Could not determine card name from filename.");
    }

    const { data: cardData, error: dbError } = await sb.from('tarot_cards').select('id, name').ilike('name->>en', `%${nameEn}%`).maybeSingle();

    if (dbError) throw new Error(`DB lookup failed: ${dbError.message}`);
    if (!cardData) throw new Error(`No card matched name: '${nameEn}'`);
    const cardId = cardData.id as string;
    console.log(`Matched card in DB: ${cardId} (${cardData.name.en})`);

    const ext = (path.split('.').pop()||'png').toLowerCase();
    const finalBucket = 'tarot-cards';
    const finalPath = `${cardId}.${ext}`;
    const up = await sb.storage.from(finalBucket).upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (up.error) throw new Error(`Final upload failed: ${up.error.message}`);

    const pub = sb.storage.from(finalBucket).getPublicUrl(finalPath);
    const upd = await sb.from('tarot_cards').update({ image_url: pub.data.publicUrl, updated_at: new Date().toISOString() }).eq('id', cardId);
    if (upd.error) throw new Error(`DB update failed: ${upd.error.message}`);

    await sb.storage.from(tmpBucket).remove([path]);

    return new Response(JSON.stringify({ ok:true, cardId, imageUrl: pub.data.publicUrl, matched:nameEn }), {
      headers: { ...corsHeaders, "Content-Type":"application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("Function error:", e.message);
    return new Response(JSON.stringify({ ok:false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type":"application/json" },
    });
  }
});