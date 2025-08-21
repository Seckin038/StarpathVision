// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function env(k: string) {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
}

// --- AI model (Gemini) ---
const genAI = new GoogleGenerativeAI(env("GEMINI_API_KEY"));
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const PROMPT = `
You are an expert in Rider–Waite–Smith tarot identification.
Return ONLY the official English card name, no extra words.
Examples: "The Fool", "Ace of Wands", "Ten of Pentacles", "Judgement".
If you see "Coins" assume "Pentacles". If you see "Rods/Staves" assume "Wands".
`;

// --- canonical helpers ---
const RANKS = ["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Page","Knight","Queen","King"];
const SUITS = ["Wands","Cups","Swords","Pentacles"];
const MAJORS = [
  "The Fool","The Magician","The High Priestess","The Empress","The Emperor","The Hierophant",
  "The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune","Justice","The Hanged Man",
  "Death","Temperance","The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World"
];

// normalize AI/file guesses → canonical RWS name
function normalizeName(s: string): string | null {
  if (!s) return null;
  let x = s.trim()
    .replaceAll("_"," ")
    .replace(/\.jpg|\.jpeg|\.png|\.webp|\.gif|\.svg/gi,"")
    .replace(/\s+/g," ")
    .replace(/ of coins/gi," of Pentacles")
    .replace(/ of pentacle(s)?/gi," of Pentacles")
    .replace(/ of rods| of staves/gi," of Wands")
    .replace(/\bjudgment\b/gi,"Judgement")
    .replace(/\bkinght\b/gi,"Knight")
    .replace(/\bthe high priestess\b/gi,"The High Priestess")
    .replace(/\bthe hanged man\b/gi,"The Hanged Man")
    .replace(/\bwheel of fortune\b/gi,"Wheel of Fortune")
    .replace(/\b(stregnth|strenght)\b/gi,"Strength");
  // try majors
  for (const m of MAJORS) if (x.toLowerCase() === m.toLowerCase()) return m;
  // try minors
  // patterns like "Ace of Wands", "Ten of Pentacles" etc.
  const m = x.match(/(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King)\s+of\s+(Wands|Cups|Swords|Pentacles)/i);
  if (m) {
    const rank = RANKS.find(r => r.toLowerCase() === m[1].toLowerCase());
    const suit = SUITS.find(u => u.toLowerCase() === m[2].toLowerCase());
    return rank && suit ? `${rank} of ${suit}` : null;
  }
  // filename hints: e.g. RWS_Tarot_08_Strength
  const hint = x.match(/\b(Fool|Magician|Priestess|Empress|Emperor|Hierophant|Lovers|Chariot|Strength|Hermit|Justice|Hanged Man|Death|Temperance|Devil|Tower|Star|Moon|Sun|Judg(e)?ment|World)\b/i);
  if (hint) {
    const guess = hint[0]
      .replace(/Priestess/i,"High Priestess")
      .replace(/Judg(e)?ment/i,"Judgement")
      .replace(/Hanged man/i,"Hanged Man");
    const full = MAJORS.find(mj => mj.toLowerCase().includes(guess.toLowerCase()));
    if (full) return full;
  }
  return null;
}

async function identifyByAI(bytes: Uint8Array, mime: string): Promise<string | null> {
  const b64 = btoa(String.fromCharCode(...bytes));
  const res = await model.generateContent([
    PROMPT,
    { inlineData: { data: b64, mimeType: mime || "image/jpeg" } }
  ]);
  const text = res?.response?.text?.() ?? "";
  return text?.trim() || null;
}

async function upsertImageForCard(supabase: any, cardName: string, file: Blob, ext: string) {
  // Zoek kaart in DB (case-insensitive). Voorkeur: exact gelijk, anders ilike begins with.
  let { data: card, error } = await supabase
    .from("tarot_cards")
    .select("id,name")
    .ilike("name", cardName)
    .single();

  if (error || !card) {
    // Probeer begins-with (bijv. "The Hanged Man (Recolor)")
    const { data: rows } = await supabase
      .from("tarot_cards")
      .select("id,name")
      .ilike("name", `${cardName}%`)
      .limit(1);
    if (!rows || !rows[0]) throw new Error(`Card '${cardName}' not found in tarot_cards`);
    card = rows[0];
  }

  const id = card.id;
  const path = `${id}.${ext || "jpg"}`;

  // Upload → bucket
  const { error: upErr } = await supabase.storage
    .from("tarot-cards")
    .upload(path, file, { cacheControl: "31536000", upsert: true });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  // Public URL
  const { data: urlData } = supabase.storage.from("tarot-cards").getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Update DB
  const { error: updErr } = await supabase
    .from("tarot_cards")
    .update({ image_url: publicUrl })
    .eq("id", id);
  if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

  return { id, name: card.name, imageUrl: publicUrl };
}

async function handleOneBlob(supabaseAdmin: any, file: Blob, filename?: string) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const ext = (filename?.split(".").pop() || "").toLowerCase() || mime.split("/")[1] || "jpg";

  // 1) snelle bestandsnaam-heuristiek
  const fromName = filename ? normalizeName(filename) : null;

  // 2) AI (indien nodig)
  const cardName = fromName ?? (await identifyByAI(buf, mime)) ?? "";
  const normalized = normalizeName(cardName || "");
  if (!normalized) throw new Error(`Could not identify card (AI + filename failed)`);

  return await upsertImageForCard(supabaseAdmin, normalized, new Blob([buf], { type: mime }), ext);
}

async function handleOneUrl(supabaseAdmin: any, url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") || "image/jpeg";
  const ab = new Uint8Array(await res.arrayBuffer());
  const fn = url.split("/").pop() || "image.jpg";
  return await handleOneBlob(supabaseAdmin, new Blob([ab], { type: ct }), fn);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    let results: any[] = [];
    const ctype = req.headers.get("content-type") || "";

    if (ctype.includes("application/json")) {
      // JSON body: { urls: string[] }
      const { urls } = await req.json();
      if (!Array.isArray(urls) || urls.length === 0) throw new Error("Body must be { urls: string[] }");
      for (const u of urls) {
        try {
          const r = await handleOneUrl(supabaseAdmin, u);
          results.push({ ok: true, via: "url", url: u, ...r });
        } catch (e) {
          results.push({ ok: false, via: "url", url: u, error: String(e) });
        }
      }
    } else {
      // multipart (files[])
      const fd = await req.formData();
      const files = fd.getAll("files").filter(Boolean) as File[];
      if (!files.length) throw new Error("No files[] in form-data");
      for (const f of files) {
        try {
          const r = await handleOneBlob(supabaseAdmin, f, (f as File).name);
          results.push({ ok: true, via: "file", file: (f as File).name, ...r });
        } catch (e) {
          results.push({ ok: false, via: "file", file: (f as File).name, error: String(e) });
        }
      }
    }

    return new Response(JSON.stringify({ results }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { headers: { ...cors, "Content-Type": "application/json" }, status: 500 });
  }
});