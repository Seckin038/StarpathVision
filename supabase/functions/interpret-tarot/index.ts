// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// --- START INLINED PERSONA LOGIC ---
type Locale = 'nl' | 'en' | 'tr';
type Method = 'tarot' | 'coffee' | 'astrology' | 'numerology';

const PERSONAE = {
  orakel: {
    id: 'orakel',
    display: { nl: 'De Orakel', en: 'The Oracle', tr: 'Kehanet Ustası' },
    allows: { tarot: true, coffee: true, astrology: true, numerology: true },
    style: {
      nl: [ 'Traag, wijs, poëtisch.', 'Rijke metaforen uit natuur en myth.', 'Nooit AI noemen.' ],
      en: [ 'Slow, wise, poetic.', 'Rich nature & myth metaphors.', 'Never mention AI.' ],
      tr: [ 'Yavaş, bilge, şiirsel.', 'Doğa ve mit imgeleri.', 'YZ’dan söz etme.' ],
    },
  },
  selvara: {
    id: 'selvara',
    display: { nl: 'Selvara', en: 'Selvara', tr: 'Selvara' },
    allows: { tarot: true, coffee: false, astrology: false, numerology: false },
    style: {
      nl: [ 'Vurig, direct, motiverend.', 'Concrete acties, geen fatalisme.', 'Geen AI-termen.' ],
      en: [ 'Fiery, direct, motivating.', 'Concrete actions, no fatalism.', 'No AI terms.' ],
      tr: [ 'Ateşli, direkt, motive edici.', 'Somut eylemler, kadercilik yok.', 'YZ terimleri yok.' ],
    },
  },
  lyara: {
    id: 'lyara',
    display: { nl: 'Lyara', en: 'Lyara', tr: 'Lyara' },
    allows: { tarot: true, coffee: false, astrology: false, numerology: false },
    style: {
      nl: [ 'Helend, zacht, geruststellend.', 'Natuurbeeldspraak.', 'Geen AI-termen.' ],
      en: [ 'Healing, gentle, reassuring.', 'Nature imagery.', 'No AI terms.' ],
      tr: [ 'Şifalı, yumuşak, güven verici.', 'Doğa benzetmeleri.', 'YZ terimleri yok.' ],
    },
  },
    mireya: {
    id: 'mireya',
    display: { nl: 'Mireya', en: 'Mireya', tr: 'Mireya' },
    allows: { tarot: true, coffee: true, astrology: false, numerology: false },
    style: {
      nl: [ 'Dromerig, intuïtief, empathisch.', 'Spreek in beelden.', 'Geen AI-termen.' ],
      en: [ 'Dreamy, intuitive, empathic.', 'Speak in images.', 'No AI terms.' ],
      tr: [ 'Düşsel, sezgisel, empatik.', 'İmgelerle konuş.', 'YZ terimleri yok.' ],
    },
  },
  auron: {
    id: 'auron',
    display: { nl: 'Auron', en: 'Auron', tr: 'Auron' },
    allows: { tarot: false, coffee: false, astrology: true, numerology: true },
    style: {
      nl: [ 'Analytisch, helder, gestructureerd.', 'Kalm en professioneel.', 'Geen AI-termen.' ],
      en: [ 'Analytical, clear, structured.', 'Calm and professional.', 'No AI terms.' ],
      tr: [ 'Analitik, net, yapılandırılmış.', 'Sakin ve profesyonel.', 'YZ terimleri yok.' ],
    },
  },
  kaelen: { id: 'kaelen', display: { nl: 'Kaelen' }, style: { nl: ['Aards, praktisch.'] } },
  tharion: { id: 'tharion', display: { nl: 'Tharion' }, style: { nl: ['Strategisch, scherp.'] } },
  corvan: { id: 'corvan', display: { nl: 'Corvan' }, style: { nl: ['Beschermend, wijs.'] } },
  eryndra: { id: 'eryndra', display: { nl: 'Eryndra' }, style: { nl: ['Creatief, vloeiend.'] } },
  vaelor: { id: 'vaelor', display: { nl: 'Vaelor' }, style: { nl: ['Moedig, rechtvaardig.'] } },
};

type PersonaId = keyof typeof PERSONAE;

function gatePersonaMethod(personaId: PersonaId, method: Method, locale: Locale = 'nl'): string | null {
  const p = PERSONAE[personaId];
  if (!p) return locale==='nl' ? 'Onbekende waarzegger.' : locale==='tr' ? 'Bilinmeyen yorumcu.' : 'Unknown seer.';
  if (!(p as any).allows || !(p as any).allows[method]) {
    const name = p.display[locale] || p.display['nl'];
    return locale==='nl' ? `${name} doet geen ${method}-lezingen.` : locale==='tr' ? `${name} ${method} okumaları yapmaz.` : `${name} does not perform ${method} readings.`;
  }
  return null;
}

function buildPersonaPreamble(locale: Locale, personaId: PersonaId): string {
  const p = PERSONAE[personaId];
  if (!p) return '';
  const name = p.display[locale] || p.display.nl;
  const style = p.style[locale] || p.style.nl;
  
  const langMap = {
    nl: `Je bent ${name}. Jouw stijl is: ${style.join(' ')}.`,
    en: `You are ${name}. Your style is: ${style.join(' ')}.`,
    tr: `Sen ${name}'sin. Tarzın: ${style.join(' ')}.`,
  };

  return langMap[locale];
}
// --- END INLINED PERSONA LOGIC ---

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
  const personaIntro = buildPersonaPreamble(locale, data.personaId as PersonaId);

  const langMap = {
    nl: {
      role: `${personaIntro}`,
      instruction:
        `Je levert een tarotinterpretatie als gestructureerde JSON. De JSON MOET deze vorm hebben: { combinedInterpretation: { story: string, advice: string, affirmation: string, actions: string[] }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Gebruik korte alinea's met warme toon. Voeg 2–3 concrete actiepuntjes toe onder 'actions'.`,
      reversed: 'omgekeerd',
    },
    en: {
      role: `${personaIntro}`,
      instruction:
        `Provide a tarot interpretation strictly as JSON with this exact shape: { combinedInterpretation: { story: string, advice: string, affirmation: string, actions: string[] }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Use short paragraphs, warm tone. Include 2–3 concrete action bullets in 'actions'.`,
      reversed: 'reversed',
    },
    tr: {
      role: `${personaIntro}`,
      instruction:
        `Tarot yorumunu yalnızca JSON olarak ver: { combinedInterpretation: { story: string, advice: string, affirmation: string, actions: string[] }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Kısa paragraflar en sıcak bir ton kullan. 'actions' altında 2–3 somut madde ekle.`,
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

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
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

    const genAI = new GoogleGenerativeAI(env('GEMINI_API_KEY'));
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = buildPrompt(body);
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      throw new Error("No response from generative model.");
    }
    
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}`);
    }

    const text = response.text();
    const jsonData = JSON.parse(text);
    
    try {
      const supabaseAdmin = createClient(
        env("SUPABASE_URL"),
        env("SUPABASE_SERVICE_ROLE_KEY")
      );
      const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
      if (user) {
        await supabaseAdmin.from('readings').insert({
          user_id: user.id,
          method: 'tarot',
          spread_id: body.spread.id,
          title: body.spread.name,
          locale: body.locale,
          payload: { spread: body.spread, cards: body.cards, personaId: body.personaId },
          interpretation: jsonData,
        });
      }
    } catch (dbError) {
      console.error("DB save error (non-critical):", dbError.message);
    }

    return new Response(JSON.stringify(jsonData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.flatten() : (err as any)?.message || 'Unexpected error';
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});