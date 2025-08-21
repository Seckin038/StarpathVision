/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { type PersonaId, buildPersonaPreamble, gatePersonaMethod, type Locale } from 'shared/persona.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CardSchema = z.object({
  index: z.number(),
  name: z.string(),
  upright: z.boolean(),
  position_key: z.string(),
  position_title: z.string(),
});

const BodySchema = z.object({
  locale: z.enum(['nl','en','tr']),
  personaId: z.string(),
  spread: z.object({ id: z.string(), name: z.string() }),
  spreadGuide: z.string(),
  cards: z.array(CardSchema).min(1),
});

function buildPrompt(data: z.infer<typeof BodySchema>): string {
  const locale = data.locale as Locale;
  const personaIntro = buildPersonaPreamble(locale, data.personaId as PersonaId, true);

  const langMap = {
    nl: {
      role: `${personaIntro}`,
      instruction:
        `Je levert een tarotinterpretatie als gestructureerde JSON. De JSON MOET deze vorm hebben: { combinedInterpretation: { story: string, advice: string, affirmation: string, actions: string[] }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Gebruik korte alinea's met warme toon. Voeg 2–3 concrete actiepuntjes toe onder 'actions'. Geef ALLEEN JSON terug, zonder markdown fences.`,
      reversed: 'omgekeerd',
    },
    en: {
      role: `${personaIntro}`,
      instruction:
        `Provide a tarot interpretation strictly as JSON with this exact shape: { combinedInterpretation: { story: string, advice: string, affirmation: string, actions: string[] }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Use short paragraphs, warm tone. Include 2–3 concrete action bullets in 'actions'. Return ONLY JSON, no fences.`,
      reversed: 'reversed',
    },
    tr: {
      role: `${personaIntro}`,
      instruction:
        `Tarot yorumunu yalnızca JSON olarak ver: { combinedInterpretation: { story: string, advice: string, affirmation: string, actions: string[] }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Kısa paragraflar en sıcak bir ton kullan. 'actions' altında 2–3 somut madde ekle. Sadece JSON dön, markdown yok.`,
      reversed: 'ters',
    },
  } as const;

  const t = langMap[locale];
  const cards = data.cards
    .map(c => `- ${c.index}. ${c.name} ${c.upright ? '' : `(${t.reversed})`} @ ${c.position_title}`)
    .join('\n');

  return [
    t.role,
    `SPREAD: ${data.spread.name}`,
    data.spreadGuide ? `GUIDE: ${data.spreadGuide}` : undefined,
    `CARDS:\n${cards}`,
    t.instruction,
  ].filter(Boolean).join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const raw = await req.json();
    const body = BodySchema.parse(raw);

    const gateMsg = gatePersonaMethod(body.personaId as PersonaId, 'tarot', body.locale as Locale);
    if (gateMsg) {
      return new Response(JSON.stringify({ error: gateMsg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = buildPrompt(body);
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^```json\n?|```$/g, '').trim();

    const jsonData = JSON.parse(text);
    
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
      if (user) {
        await supabaseAdmin.from('readings').insert({
          user_id: user.id,
          method: 'tarot',
          spread_id: body.spread.id,
          title: body.spread.name,
          payload: { spread: body.spread, cards: body.cards, personaId: body.personaId, locale: body.locale },
          interpretation: jsonData,
        });
      }
    } catch (dbError) {
      console.error("DB save error (non-critical):", dbError.message);
    }

    return new Response(JSON.stringify(jsonData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.flatten() : (err as any)?.message || 'Unexpected error';
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});