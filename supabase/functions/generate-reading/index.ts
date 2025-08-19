import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://dmsrsgecdvoswxopylfm.supabase.co", // Beperkt tot jouw domein
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const BodySchema = z.object({
  readingType: z.enum(["Tarot", "Koffiedik", "Numerologie", "Droomduiding"]),
  language: z.string().default("nl"),
  persona: z.any(),
  cards: z.array(z.any()).optional(),
  symbols: z.array(z.any()).optional(),
  numerologyData: z.any().optional(),
  userQuestion: z.string().optional(),
});

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// Helper voor taal-specifieke prompts
function buildPrompt(body: z.infer<typeof BodySchema>): string {
  let content = `Je bent ${body.persona.name}, een ${body.persona.description}. `;
  content += `Je achtergrond is: ${body.persona.background}. `;
  content += `Je specialisaties zijn: ${body.persona.specializations.join(', ')}. `;
  
  const instructions = {
    nl: `Genereer een waarzegging in het Nederlands. De gebruiker heeft een ${body.readingType} lezing gedaan. Geef een diepgaande, inzichtelijke en poëtische interpretatie. Spreek direct tot de gebruiker ('je', 'jouw'). De toon moet mysterieus en wijs zijn. Geef alleen de waarzegging terug, zonder extra opmaak of inleidende zinnen.`,
    en: `Generate a fortune telling in English. The user has done a ${body.readingType} reading. Provide a deep, insightful, and poetic interpretation. Speak directly to the user ('you', 'your'). The tone should be mysterious and wise. Return only the divination, without extra formatting or introductory phrases.`,
    tr: `Türkçe bir kehanet oluşturun. Kullanıcı bir ${body.readingType} okuması yaptı. Derin, anlayışlı ve şiirsel bir yorum sağlayın. Doğrudan kullanıcıya ('sen', 'senin') hitap edin. Ton gizemli ve bilge olmalı. Sadece kehaneti, ek biçimlendirme veya giriş cümleleri olmadan döndürün.`,
  };

  content += instructions[body.language as keyof typeof instructions] || instructions.nl;

  if (body.cards && body.cards.length > 0) {
    const cardDetails = body.cards.map((c: any) => `${c.position}: ${c.card.name} (Meaning: ${c.card.meaning_up})`).join(', ');
    content += ` The drawn cards are: ${cardDetails}.`;
  }

  if (body.symbols && body.symbols.length > 0) {
    const symbolDetails = body.symbols.map((s: any) => `${s.symbol_name_nl || s.symbol_name}: ${s.description_nl || s.description}`).join(', ');
    content += ` The chosen symbols are: ${symbolDetails}.`;
  }

  if (body.readingType === "Numerologie" && body.numerologyData) {
    content += ` The user provided: Date of Birth: ${body.numerologyData.birthDate}, Full Name: ${body.numerologyData.fullName}. Calculate the core numbers (Life Path, Destiny, Soul Urge) and provide a personal, in-depth numerological reading.`;
  }

  if (body.userQuestion) {
    content += ` The user's question is: "${body.userQuestion}".`;
  }

  return content;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rid = crypto.randomUUID();
  const t0 = Date.now();
  try {
    const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const rawBody = await req.json().catch(() => ({}));
    const body = BodySchema.parse(rawBody);
    const GEMINI_API_KEY = env("GEMINI_API_KEY");
    const model = "gemini-1.5-flash-latest";
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = buildPrompt(body);

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Gemini API Error: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const readingText = geminiData.candidates[0].content.parts[0].text;
    const duration_ms = Date.now() - t0;

    const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
    
    if (user) {
      await supabaseAdmin.from('readings').insert({
        user_id: user.id,
        reading_type: body.readingType,
        language: body.language,
        cards_selected: body.cards,
        symbols_selected: body.symbols,
        user_question: body.userQuestion,
        reading_result: readingText,
        duration_ms,
        model,
        rid,
      });
    }

    console.log(`[${rid}] OK in ${duration_ms}ms`);
    return new Response(JSON.stringify({ reading: readingText, rid }), { headers: corsHeaders, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[${rid}] ERROR after ${Date.now() - t0}ms`, msg);
    const status = error instanceof z.ZodError ? 400 : 500;
    return new Response(JSON.stringify({ error: msg, rid }), { headers: corsHeaders, status });
  }
});