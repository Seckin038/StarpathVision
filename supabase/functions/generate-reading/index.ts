// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  locale: z.enum(['nl', 'en', 'tr']),
  personaId: z.string(),
  method: z.string(),
  payload: z.any(),
});

const TAROT_PROMPT_TEMPLATES = {
  nl: `
Je gaat een tarotkaurtlezing doen in de rol van {{persona_name}}.
Jouw stijl is: {{persona_style}}.

De vraag van de gebruiker is: "{{user_question}}"
De gebruikte legging is de "{{spread_name}}".
De getrokken kaarten zijn:
{{cards_list}}

GEEF EEN UITGEBREIDE EN INZICHTELIJKE LEZING.
Je antwoord MOET een geldig JSON-object zijn met de volgende structuur:
{
  "story": "Schrijf hier 'Het Verhaal van de Kaarten'. Dit is een samenvatting die de reis en de belangrijkste boodschap van de kaarten beschrijft in een verhalende vorm.",
  "advice": "Schrijf hier 'Advies voor Jou'. Dit is een direct en persoonlijk advies gebaseerd op de hele legging.",
  "affirmation": "Schrijf hier een korte, krachtige 'Affirmatie' die de gebruiker kan helpen.",
  "actions": [
    "Een concrete, uitvoerbare actie.",
    "Nog een concrete actie."
  ],
  "card_interpretations": [
    {
      "card_index": 1,
      "interpretation": "Een gedetailleerde uitleg voor de eerste kaart in de context van zijn positie. Verbind de betekenis met de vraag van de gebruiker."
    },
    {
      "card_index": 2,
      "interpretation": "Een gedetailleerde uitleg voor de tweede kaart..."
    }
  ]
}

Zorg ervoor dat de 'card_interpretations' array precies evenveel objecten bevat als er kaarten zijn getrokken. Schrijf alle tekst in de stem en stijl van jouw persona.
`,
  en: `
You will perform a tarot card reading in the role of {{persona_name}}.
Your style is: {{persona_style}}.

The user's question is: "{{user_question}}"
The spread used is the "{{spread_name}}".
The cards drawn are:
{{cards_list}}

PROVIDE A COMPREHENSIVE AND INSIGHTFUL READING.
Your answer MUST be a valid JSON object with the following structure:
{
  "story": "Write 'The Story of the Cards' here. This is a summary describing the journey and main message of the cards in a narrative form.",
  "advice": "Write 'Advice for You' here. This is direct and personal advice based on the entire reading.",
  "affirmation": "Write a short, powerful 'Affirmation' here to help the user.",
  "actions": [
    "A concrete, actionable step.",
    "Another concrete action."
  ],
  "card_interpretations": [
    {
      "card_index": 1,
      "interpretation": "A detailed explanation for the first card in the context of its position. Connect the meaning to the user's question."
    },
    {
      "card_index": 2,
      "interpretation": "A detailed explanation for the second card..."
    }
  ]
}

Ensure the 'card_interpretations' array contains exactly as many objects as cards drawn. Write all text in the voice and style of your persona.
`,
  tr: `
{{persona_name}} rolünde bir tarot kartı okuması yapacaksınız.
Tarzınız: {{persona_style}}.

Kullanıcının sorusu: "{{user_question}}"
Kullanılan açılım: "{{spread_name}}".
Çekilen kartlar:
{{cards_list}}

KAPSAMLI VE ANLAYIŞLI BİR OKUMA YAPIN.
Cevabınız aşağıdaki yapıya sahip geçerli bir JSON nesnesi OLMALIDIR:
{
  "story": "Buraya 'Kartların Hikayesi'ni yazın. Bu, kartların yolculuğunu ve ana mesajını anlatısal bir biçimde açıklayan bir özettir.",
  "advice": "Buraya 'Sizin İçin Tavsiye' yazın. Bu, tüm okumaya dayanan doğrudan ve kişisel bir tavsiyedir.",
  "affirmation": "Kullanıcıya yardımcı olmak için buraya kısa, güçlü bir 'Olumlama' yazın.",
  "actions": [
    "Somut, uygulanabilir bir eylem.",
    "Başka bir somut eylem."
  ],
  "card_interpretations": [
    {
      "card_index": 1,
      "interpretation": "İlk kart için pozisyonu bağlamında ayrıntılı bir açıklama. Anlamı kullanıcının sorusuyla ilişkilendirin."
    },
    {
      "card_index": 2,
      "interpretation": "İkinci kart için ayrıntılı bir açıklama..."
    }
  ]
}

'card_interpretations' dizisinin çekilen kart sayısı kadar nesne içerdiğinden emin olun. Tüm metni kişiliğinizin sesi ve tarzıyla yazın.
`
};

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

async function getPersona(supabaseAdmin, id: string) {
  const { data, error } = await supabaseAdmin.from('personas').select('*').eq('id', id).single();
  if (error) throw new Error(`Persona not found: ${id}`);
  return data;
}

function buildPrompt(locale: string, persona: any, method: string, payload: any): string {
  if (method === 'tarot') {
    let prompt = TAROT_PROMPT_TEMPLATES[locale] || TAROT_PROMPT_TEMPLATES['en'];
    const orientationText = {
      nl: { upright: 'Rechtop', reversed: 'Omgekeerd' },
      en: { upright: 'Upright', reversed: 'Reversed' },
      tr: { upright: 'Düz', reversed: 'Ters' },
    };
    const cardsList = payload.cards.map((c: any) => 
      `- Kaart ${c.index} (${c.position_title}): ${c.name} (${c.upright ? orientationText[locale].upright : orientationText[locale].reversed})`
    ).join('\n');
    const userQuestion = payload.userQuestion || (locale === 'nl' ? "Geef een algemene lezing over de huidige situatie." : "Give a general reading about the current situation.");

    prompt = prompt.replace(/{{persona_name}}/g, persona.display_name?.[locale] || persona.id);
    prompt = prompt.replace(/{{persona_style}}/g, persona.style?.[locale]?.join(', ') || 'wise and insightful');
    prompt = prompt.replace(/{{user_question}}/g, userQuestion);
    prompt = prompt.replace(/{{spread_name}}/g, payload.spread.name);
    prompt = prompt.replace(/{{cards_list}}/g, cardsList);
    
    return prompt;
  }

  // Fallback for other methods
  let basePrompt = persona.prompt_template || "Je bent een behulpzame assistent in de rol van {{persona_name}}.";
  basePrompt = basePrompt.replace(/{{persona_name}}/g, persona.display_name?.[locale] || persona.id);
  basePrompt = basePrompt.replace(/{{locale}}/g, locale);
  basePrompt = basePrompt.replace(/{{method}}/g, method);
  
  let details = "";
  if (method === 'koffiedik') {
    const symbols = payload.symbols.map((s:any) => `- ${s[`symbol_name_${locale}`] || s.symbol_name_nl}: ${s[`description_${locale}`] || s.description_nl}`).join('\n');
    details = `Symbolen:\n${symbols}`;
  } else if (method === 'dromen') {
    details = `Droom: ${payload.userQuestion}`;
  } else if (method === 'numerologie') {
    details = `Naam: ${payload.numerologyData.fullName}, Geboortedatum: ${payload.numerologyData.birthDate}`;
  }
  
  basePrompt = basePrompt.replace(/{{details}}/g, details);
  basePrompt = basePrompt.replace(/{{vraag}}/g, payload.userQuestion || "Geef een algemene lezing.");

  const jsonInstruction = `

GEEF EEN UITGEBREIDE EN INZICHTELIJKE LEZING.
Je antwoord MOET een geldig JSON-object zijn met de volgende structuur:
{
  "reading": "Schrijf hier de volledige lezing. Gebruik Markdown voor opmaak: **vet**, *cursief*, ## Titels, - Lijst-items, en > Quotes. Gebruik \\n\\n voor nieuwe alinea's."
}
Schrijf alle tekst in de stem en stijl van jouw persona.
`;
  
  return basePrompt + jsonInstruction;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const raw = await req.json();
    const body = BodySchema.parse(raw);

    const persona = await getPersona(supabaseAdmin, body.personaId);

    const genAI = new GoogleGenerativeAI(env('GEMINI_API_KEY'));
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = buildPrompt(body.locale, persona, body.method, body.payload);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const resultJson = JSON.parse(text);

    // Save to DB
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
      if (user) {
        await supabaseAdmin.from('readings').insert({
          user_id: user.id,
          method: body.method,
          locale: body.locale,
          payload: body.payload,
          interpretation: resultJson,
          spread_id: body.method === 'tarot' ? body.payload.spread.id : null,
          title: body.method === 'tarot' ? body.payload.spread.name : body.method,
        });
      }
    } catch (dbError) {
      console.error("DB save error (non-critical):", dbError.message);
    }

    return new Response(JSON.stringify({ reading: resultJson }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.flatten() : (err as any)?.message || 'Unexpected error';
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});