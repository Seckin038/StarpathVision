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
Beschrijving van de legging: "{{spread_guide}}"

De getrokken kaarten zijn:
{{cards_list}}

GEEF EEN UITGEBREIDE EN INZICHTELIJKE LEZING in het Nederlands.
De structuur van je antwoord MOET als volgt zijn:

1.  **Samenvatting:** Begin met een algemene samenvatting van de lezing in 2-4 zinnen. Vat de belangrijkste boodschap van de kaarten samen in relatie tot de vraag.
2.  **Kaart-voor-kaart Analyse:** Geef voor ELKE kaart een gedetailleerde uitleg.
    - Begin elke kaartuitleg met "Kaart X: [Kaartnaam]".
    - Leg de betekenis van de kaart uit in de context van zijn positie in de legging.
    - Verbind de betekenis van de kaart met de vraag van de gebruiker.
    - Wees diepgaand en geef concrete inzichten.
3.  **Conclusie & Advies:** Sluit af met een conclusie die de inzichten samenvat en geef praktisch advies op basis van de lezing.

Schrijf de hele lezing in de stem en stijl van jouw persona. Wees creatief en help de gebruiker echt verder.
`,
  en: `
You will perform a tarot card reading in the role of {{persona_name}}.
Your style is: {{persona_style}}.

The user's question is: "{{user_question}}"

The spread used is the "{{spread_name}}".
Description of the spread: "{{spread_guide}}"

The cards drawn are:
{{cards_list}}

PROVIDE A COMPREHENSIVE AND INSIGHTFUL READING in English.
The structure of your answer MUST be as follows:

1.  **Summary:** Start with a general summary of the reading in 2-4 sentences. Summarize the main message of the cards in relation to the question.
2.  **Card-by-Card Analysis:** Provide a detailed explanation for EACH card.
    - Start each card explanation with "Card X: [Card Name]".
    - Explain the meaning of the card in the context of its position in the spread.
    - Connect the card's meaning to the user's question.
    - Be in-depth and provide concrete insights.
3.  **Conclusion & Advice:** Conclude with a summary of the insights and provide practical advice based on the reading.

Write the entire reading in the voice and style of your persona. Be creative and genuinely help the user.
`,
  tr: `
{{persona_name}} rolünde bir tarot kartı okuması yapacaksınız.
Tarzınız: {{persona_style}}.

Kullanıcının sorusu: "{{user_question}}"

Kullanılan açılım: "{{spread_name}}".
Açılımın açıklaması: "{{spread_guide}}"

Çekilen kartlar:
{{cards_list}}

TÜRKÇE olarak KAPSAMLI VE ANLAYIŞLI BİR OKUMA YAPIN.
Cevabınızın yapısı ŞU ŞEKİLDE OLMALIDIR:

1.  **Özet:** Okumanın genel bir özetiyle 2-4 cümleyle başlayın. Kartların ana mesajını soruyla ilişkili olarak özetleyin.
2.  **Kart Kart Analizi:** HER kart için ayrıntılı bir açıklama yapın.
    - Her kart açıklamasını "Kart X: [Kart Adı]" ile başlatın.
    - Kartın anlamını açılımdaki konumu bağlamında açıklayın.
    - Kartın anlamını kullanıcının sorusuyla ilişkilendirin.
    - Derinlemesine olun ve somut bilgiler verin.
3.  **Sonuç ve Tavsiye:** Bilgileri özetleyen bir sonuçla bitirin ve okumaya dayalı pratik tavsiyeler verin.

Tüm okumayı kişiliğinizin sesi ve tarzıyla yazın. Yaratıcı olun ve kullanıcıya gerçekten yardımcı olun.
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
    prompt = prompt.replace(/{{spread_guide}}/g, payload.spreadGuide);
    prompt = prompt.replace(/{{cards_list}}/g, cardsList);
    
    return prompt;
  }

  // Fallback to old logic for other methods
  let basePrompt = persona.prompt_template || "Je bent een behulpzame assistent in de rol van {{persona_name}}.";
  basePrompt = basePrompt.replace(/{{persona_name}}/g, persona.display_name?.[locale] || persona.id);
  basePrompt = basePrompt.replace(/{{locale}}/g, locale);
  basePrompt = basePrompt.replace(/{{method}}/g, method);
  
  let details = "";
  if (method === 'koffiedik') {
    const symbols = payload.symbols.map(s => `- ${s[`symbol_name_${locale}`]}: ${s[`description_${locale}`]}`).join('\n');
    details = `Symbolen:\n${symbols}`;
  } else if (method === 'dromen') {
    details = `Droom: ${payload.userQuestion}`;
  } else if (method === 'numerologie') {
    details = `Naam: ${payload.numerologyData.fullName}, Geboortedatum: ${payload.numerologyData.birthDate}`;
  }
  
  basePrompt = basePrompt.replace(/{{details}}/g, details);
  basePrompt = basePrompt.replace(/{{vraag}}/g, payload.userQuestion || "Geef een algemene lezing.");

  return basePrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const raw = await req.json();
    const body = BodySchema.parse(raw);

    const persona = await getPersona(supabaseAdmin, body.personaId);

    const genAI = new GoogleGenerativeAI(env('GEMINI_API_KEY'));
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = buildPrompt(body.locale, persona, body.method, body.payload);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Save to DB
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
      if (user) {
        await supabaseAdmin.from('readings').insert({
          user_id: user.id,
          method: body.method,
          locale: body.locale,
          payload: body.payload,
          interpretation: { text },
          spread_id: body.method === 'tarot' ? body.payload.spread.id : null,
          title: body.method === 'tarot' ? body.payload.spread.name : body.method,
        });
      }
    } catch (dbError) {
      console.error("DB save error (non-critical):", dbError.message);
    }

    return new Response(JSON.stringify({ reading: text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.flatten() : (err as any)?.message || 'Unexpected error';
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});