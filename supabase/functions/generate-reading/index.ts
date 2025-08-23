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

// Helper to find and parse JSON from a string that might contain markdown fences or other text
function extractAndParseJson(text: string): any {
  const jsonRegex = /```json\n([\s\S]*?)\n```/;
  const match = text.match(jsonRegex);
  
  let jsonString = text;
  if (match && match[1]) {
    jsonString = match[1];
  } else {
    // Trim whitespace and newlines that might surround the JSON object
    jsonString = jsonString.trim();
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", jsonString);
    throw new Error("AI returned invalid JSON response.");
  }
}

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

    const method = String(body?.method ?? "").toLowerCase();
    if (!["tarot","koffiedik","dromen","numerologie"].includes(method)) {
      throw new Error(`Unsupported method '${method}'`);
    }

    // Map to English terms for DB consistency to satisfy the check constraint
    const dbMethodMap: { [key: string]: string } = {
      tarot: 'tarot',
      koffiedik: 'coffee',
      dromen: 'dream',
      numerologie: 'numerology',
    };
    const dbMethod = dbMethodMap[method] || method;

    const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userRes?.user ?? null;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    let instruction = "";
    let jsonSchema = {};

    if (method === 'tarot') {
      instruction = `You are a mystical tarot reader. Based on the user's reading, provide a detailed and insightful interpretation in the requested language.`;
      jsonSchema = {
        type: "object",
        properties: {
          story: { type: "string", description: "A narrative weaving the cards' meanings together." },
          advice: { type: "string", description: "Actionable advice for the user." },
          affirmation: { type: "string", description: "A positive affirmation." },
          actions: { type: "array", items: { type: "string" }, description: "An array of 3-5 concrete next steps." },
          card_interpretations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                card_index: { type: "number" },
                interpretation: { type: "string" },
              },
              required: ["card_index", "interpretation"],
            },
            description: "An array of objects, one for each card, with its index and specific interpretation in the context of its position."
          },
        },
        required: ["story", "advice", "affirmation", "actions", "card_interpretations"],
      };
    } else {
      instruction = `You are a mystical reader. Based on the user's input for the specified method, provide a detailed and insightful interpretation in the requested language.`;
      jsonSchema = {
        type: "object",
        properties: {
          reading: { type: "string", description: "The full, detailed interpretation as a single string, formatted with markdown." },
        },
        required: ["reading"],
      };
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest", 
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      } 
    });

    const prompt = JSON.stringify({
      instruction,
      method,
      locale: body?.locale ?? "nl",
      payload: body?.payload ?? {}
    });

    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text?.() ?? "{}";
    const interpretation = extractAndParseJson(rawText);

    let payload = JSON.parse(JSON.stringify(body?.payload ?? {}));
    if (method === "koffiedik" && Array.isArray(payload.symbols)) {
      payload.symbols = payload.symbols.map((s: any) => ({
        symbol_name_nl: s.symbol_name_nl ?? s.name ?? null,
        symbol_name_en: s.symbol_name_en ?? null,
        symbol_name_tr: s.symbol_name_tr ?? null,
      }));
    }

    let title = body?.title ?? method;
    let spread_id: string | null = null;
    if (method === "tarot" && body?.payload?.spread?.id) {
      spread_id = String(body.payload.spread.id);
      title = body?.payload?.spread?.name?.[body?.locale ?? "nl"] ?? spread_id;
    }

    if (user) {
      const insertRow = {
        user_id: user.id,
        method: dbMethod, // Use the mapped English method here
        locale: body?.locale ?? "nl",
        title,
        spread_id,
        payload,
        interpretation,
        thumbnail_url: body?.thumbnail_url ?? null,
      };

      const { error: insertError } = await supa.from("readings").insert(insertRow);
      if (insertError) {
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