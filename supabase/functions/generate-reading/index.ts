import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const BodySchema = z.object({
  readingType: z.enum(["Tarot", "Koffiedik", "Numerologie"]),
  language: z.string().default("nl"),
  persona: z.any().optional(),
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
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    let content = `Je bent ${body.persona.name}, een ${body.persona.description}. `;
    content += `Je achtergrond is: ${body.persona.background}. `;
    content += `Je specialisaties zijn: ${body.persona.specializations.join(', ')}. `;
    content += `Genereer een waarzegging in de taal: ${body.language}. `;
    content += `De gebruiker heeft een ${body.readingType} lezing gedaan. `;

    if (body.cards && body.cards.length > 0) {
      const cardDetails = body.cards.map((c: any) => `${c.position}: ${c.card.name} (Betekenis: ${c.card.meaning_up})`).join(', ');
      content += `De getrokken kaarten zijn: ${cardDetails}. `;
    }

    if (body.symbols && body.symbols.length > 0) {
      const symbolDetails = body.symbols.map((s: any) => `${s['Symbool NL']}: ${s['Betekenis NL']}`).join(', ');
      content += `De gekozen symbolen zijn: ${symbolDetails}. `;
    }

    if (body.readingType === "Numerologie" && body.numerologyData) {
      content += `De gebruiker heeft de volgende gegevens ingevoerd: Geboortedatum: ${body.numerologyData.birthDate}, Volledige naam: ${body.numerologyData.fullName}. `;
      content += `Bereken de kerngetallen (Levenspad, Bestemming, Zielsverlangen) en geef een persoonlijke, diepgaande numerologische lezing gebaseerd op deze getallen.`;
    }

    if (body.userQuestion) {
      content += `De vraag van de gebruiker is: "${body.userQuestion}". `;
    }

    content += "Geef een diepgaande, inzichtelijke en poëtische interpretatie gebaseerd op deze informatie. Spreek direct tot de gebruiker ('je', 'jouw'). De toon moet mysterieus en wijs zijn. Geef alleen de waarzegging terug, zonder extra opmaak of inleidende zinnen zoals 'Hier is je lezing:'.";

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: content }] }] }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Gemini API Error: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const readingText = geminiData.candidates[0].content.parts[0].text;

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
      });
    }

    console.log(`[${rid}] OK in ${Date.now() - t0}ms`);
    return new Response(JSON.stringify({ reading: readingText, rid }), { headers: corsHeaders, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[${rid}] ERROR after ${Date.now() - t0}ms`, msg);
    const status = error instanceof z.ZodError ? 400 : 500;
    return new Response(JSON.stringify({ error: msg, rid }), { headers: corsHeaders, status });
  }
});