// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const cors = (req: Request) => {
  const origin = req.headers.get("Origin") ?? "*";
  const acrh = req.headers.get("Access-Control-Request-Headers") ?? "authorization, x-client-info, apikey, content-type";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": acrh,
  };
};

Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
    if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_API_KEY) {
      throw new Error("Missing env vars: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY");
    }

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();

    // Verwacht: { locale, personaId, method, payload }
    const method = String(body?.method ?? "").toLowerCase(); // tarot | koffiedik | dromen | numerologie
    if (!["tarot","koffiedik","dromen","numerologie"].includes(method)) {
      throw new Error(`Unsupported method '${method}'`);
    }

    // Haal user uit token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userRes?.user ?? null;

    // === GENEREER LEZING (ingekort; jouw prompt/pipeline kan hier blijven) ===
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { responseMimeType: "application/json" } });

    // Minimal prompt per methode
    const prompt = JSON.stringify({
      method,
      locale: body?.locale ?? "nl",
      instruction: "Return valid JSON only.",
      payload: body?.payload ?? {}
    });

    const result = await model.generateContent(prompt);
    const jsonText = result?.response?.text?.() ?? "{}";
    const interpretation = JSON.parse(jsonText);

    // === SANITIZE PAYLOAD (licht) ===
    let payload = JSON.parse(JSON.stringify(body?.payload ?? {}));
    if (method === "koffiedik" && Array.isArray(payload.symbols)) {
      payload.symbols = payload.symbols.map((s: any) => ({
        symbol_name_nl: s.symbol_name_nl ?? s.name ?? null,
        symbol_name_en: s.symbol_name_en ?? null,
        symbol_name_tr: s.symbol_name_tr ?? null,
      }));
    }

    // === TITEL + SPREAD_ID ===
    let title = body?.title ?? method;
    let spread_id: string | null = null;
    if (method === "tarot" && body?.payload?.spread?.id) {
      spread_id = String(body.payload.spread.id);
      title = body?.payload?.spread?.name?.[body?.locale ?? "nl"] ?? spread_id;
    }

    // === OPSLAAN (alleen als ingelogd) ===
    if (user) {
      const insertRow = {
        user_id: user.id,          // <- matcht RLS
        method,
        locale: body?.locale ?? "nl",
        title,
        spread_id,
        payload,
        interpretation,
        thumbnail_url: body?.thumbnail_url ?? null,
      };

      const { error: insertError } = await supa.from("readings").insert(insertRow);
      if (insertError) {
        // NIET verzwijgen → UI krijgt dit terug
        throw new Error(`DB insert failed: ${insertError.message}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, interpretation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});