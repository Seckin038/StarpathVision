// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function aiIdentify(bytes: Uint8Array, mime: string, key?: string){
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
  const prompt = `Return ONLY the official English tarot card name (e.g., "The Fool", "Ace of Wands", "Judgement"). If you see Coins→Pentacles; Rods/Staves→Wands.`;
  const body = { contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: mime||"image/jpeg", data: encode(bytes) } } ] }] };
  const r = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`AI HTTP ${r.status}`);
  const j = await r.json();
  return j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { record: queueItem } = await req.json();
  if (!queueItem) return new Response(JSON.stringify({ error: "Missing record" }), { status: 400 });

  const sbAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');

  const updateQueue = (status: string, error_message?: string) => 
    sbAdmin.from('card_import_queue').update({ status, error_message }).eq('id', queueItem.id);

  try {
    await updateQueue('processing');

    const { storage_path, original_filename } = queueItem;
    const tmpBucket = 'tarot-card-uploads';
    
    const { data: blob, error: dlError } = await sbAdmin.storage.from(tmpBucket).download(storage_path);
    if (dlError) throw new Error(`Download failed: ${dlError.message}`);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    let nameEn = await aiIdentify(bytes, blob.type, GEMINI_KEY).catch(e => {
      console.error("AI failed:", e.message);
      return null;
    });

    if (!nameEn) {
      const base = (original_filename || '').replace(/[_-]+/g,' ').replace(/\.[^.]+$/, '').trim();
      nameEn = base.replace(/^\d+\s*/, '').replace(/([A-Z])/g, ' $1').trim();
    }
    if (!nameEn) throw new Error("Could not determine card name.");

    const { data: cardData, error: dbError } = await sbAdmin.from('tarot_cards').select('id').ilike('name->>en', `%${nameEn}%`).maybeSingle();
    if (dbError) throw new Error(`DB lookup failed: ${dbError.message}`);
    if (!cardData) throw new Error(`No card matched name: '${nameEn}'`);
    
    const cardId = cardData.id;
    const ext = (original_filename.split('.').pop()||'png').toLowerCase();
    const finalPath = `${cardId}.${ext}`;
    
    const { error: upError } = await sbAdmin.storage.from('tarot-cards').upload(finalPath, blob, { upsert: true, contentType: blob.type });
    if (upError) throw new Error(`Final upload failed: ${upError.message}`);

    const { data: pubUrl } = sbAdmin.storage.from('tarot-cards').getPublicUrl(finalPath);
    const { error: updError } = await sbAdmin.from('tarot_cards').update({ image_url: pubUrl.publicUrl, updated_at: new Date().toISOString() }).eq('id', cardId);
    if (updError) throw new Error(`DB update failed: ${updError.message}`);

    await sbAdmin.storage.from(tmpBucket).remove([storage_path]);
    await updateQueue('completed');

    return new Response(JSON.stringify({ ok: true, cardId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    await updateQueue('error', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});