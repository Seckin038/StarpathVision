// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// ===== CORS helper =====
function cors(req: Request){
  const origin = req.headers.get("Origin") ?? "*";
  const reqHdrs = req.headers.get("Access-Control-Request-Headers") ??
    "authorization, x-client-info, apikey, content-type";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": reqHdrs,
    "Access-Control-Max-Age": "86400",
  } as const;
}

// ===== (optioneel) eenvoudige AI via Gemini REST =====
async function aiIdentify(bytes: Uint8Array, mime: string, key?: string){
  if (!key) return null; // fallback zal filename gebruiken
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
  const CORS = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (req.method !== "POST") return new Response(JSON.stringify({error:"METHOD"}), { status:405, headers:{...CORS, "Content-Type":"application/json"} });

    const { path } = await req.json().catch(()=>({}));
    if (!path) throw new Error("'path' is required (temp storage path)");

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GEMINI_KEY  = Deno.env.get('GEMINI_API_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE key");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) Download from temp bucket
    const tmpBucket = 'tarot-card-uploads';
    const dl = await sb.storage.from(tmpBucket).download(path);
    if (dl.error) throw new Error(`Download failed: ${dl.error.message}`);
    const blob = dl.data;
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // 2) AI identify (fallback: filename → tidy to english)
    let nameEn = await aiIdentify(bytes, blob.type, GEMINI_KEY).catch(()=>null);
    if (!nameEn){
      const base = (path.split('/').pop()||'').replace(/[_-]+/g,' ').replace(/\.[^.]+$/, '').trim();
      nameEn = base; // DB‑lookup zal bepalen of dit matcht
    }

    // 3) Find card by English name (case‑insensitive)
    const q = await sb.from('tarot_cards').select('id, name').ilike('name->>en', nameEn).maybeSingle();
    if (q.error) throw new Error(`DB lookup failed: ${q.error.message}`);
    if (!q.data) throw new Error(`No card matched: '${nameEn}'`);
    const cardId = q.data.id as string;

    // 4) Upload to final bucket
    const ext = (path.split('.').pop()||'png').toLowerCase();
    const finalBucket = 'tarot-cards';
    const finalPath = `${cardId}.${ext}`;
    const up = await sb.storage.from(finalBucket).upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (up.error) throw new Error(`Final upload failed: ${up.error.message}`);

    // 5) Public URL + DB update
    const pub = sb.storage.from(finalBucket).getPublicUrl(finalPath);
    const upd = await sb.from('tarot_cards').update({ image_url: pub.data.publicUrl, updated_at: new Date().toISOString() }).eq('id', cardId);
    if (upd.error) throw new Error(`DB update failed: ${upd.error.message}`);

    // 6) Cleanup temp
    await sb.storage.from(tmpBucket).remove([path]);

    return new Response(JSON.stringify({ ok:true, cardId, imageUrl: pub.data.publicUrl, matched:nameEn }), {
      headers: { ...CORS, "Content-Type":"application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type":"application/json" },
    });
  }
});