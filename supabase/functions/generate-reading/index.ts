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

const SYSTEM_INSTRUCTION_TEMPLATES = {
  nl: `
JOUW ROL:
- Je bent een waarzegger genaamd {{persona_name}}.
- Jouw stijl is: {{persona_style}}.
- Gebruik de volgende richtlijnen voor jouw toon en inhoud: "{{persona_prompt_template}}"
`,
  en: `
YOUR ROLE:
- You are a seer named {{persona_name}}.
- Your style is: {{persona_style}}.
- Use the following guidelines for your tone and content: "{{persona_prompt_template}}"
`,
  tr: `
SENİN ROLÜN:
- Adın {{persona_name}} olan bir kahinsin.
- Tarzın: {{persona_style}}.
- Tonun ve içeriğin için şu yönergeleri kullan: "{{persona_prompt_template}}"
`
};

const TAROT_USER_PROMPT_TEMPLATES = {
  nl: `
JOUW TAAK:
- Voer een tarotkaurtlezing uit.
- De vraag van de gebruiker is: "{{user_question}}"
- De gebruikte legging is de "{{spread_name}}".
- De getrokken kaarten zijn:
{{cards_list}}

TAAL: Alle tekst, inclusief kaartnamen, moet in het Nederlands zijn.

OUTPUT FORMAAT:
- Je antwoord MOET een geldig JSON-object zijn met de volgende structuur:
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
    }
  ]
}

BELANGRIJK: Voordat je je JSON afrondt, controleer dubbel of je geen Engelse kaartnamen zoals 'The Star' of 'King of Cups' hebt gebruikt. Gebruik alleen de verstrekte Nederlandse namen.
`,
  en: `
YOUR TASK:
- Perform a tarot card reading.
- The user's question is: "{{user_question}}"
- The spread used is the "{{spread_name}}".
- The cards drawn are:
{{cards_list}}

LANGUAGE: All text, including card names, must be in English.

OUTPUT FORMAT:
- Your answer MUST be a valid JSON object with the following structure:
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
    }
  ]
}

IMPORTANT: Before finalizing your JSON, double-check to ensure you have not used any non-English card names. Use only the English names provided.
`,
  tr: `
SENİN GÖREVİN:
- Bir tarot kartı okuması yap.
- Kullanıcının sorusu: "{{user_question}}"
- Kullanılan açılım: "{{spread_name}}".
- Çekilen kartlar:
{{cards_list}}

KULLANILACAK DİL: Tüm metinler, kart adları da dahil olmak üzere, Türkçe olmalıdır.

ÇIKTI FORMATI:
- Cevabınız aşağıdaki yapıya sahip geçerli bir JSON nesnesi OLMALIDIR:
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
    }
  ]
}

ÖNEMLİ: JSON'unuzu sonlandırmadan önce, 'The Star' veya 'King of Cups' gibi İngilizce kart adları kullanmadığınızdan emin olmak için iki kez kontrol edin. Yalnızca sağlanan Türkçe adları kullanın.
`
};

const OTHER_METHOD_USER_PROMPT_TEMPLATES = {
  nl: `
JOUW TAAK:
- Voer een '{{method}}' lezing uit.
- De input van de gebruiker is:
{{details}}

OUTPUT FORMAAT:
- Je antwoord MOET een geldig JSON-object zijn.
- Gebruik exact deze structuur: { "reading": "Jouw volledige lezing hier..." }
- Binnen de "reading" string, gebruik Markdown voor opmaak (bv. **vet**, *cursief*, ## Titels, - Lijstjes).
`,
  en: `
YOUR TASK:
- Perform a '{{method}}' reading.
- The user's input is:
{{details}}

OUTPUT FORMAT:
- Your answer MUST be a valid JSON object.
- Use this exact structure: { "reading": "Your full reading here..." }
- Within the "reading" string, use Markdown for formatting (e.g., **bold**, *italic*, ## Headings, - Lists).
`,
  tr: `
SENİN GÖREVİN:
- Bir '{{method}}' okuması yap.
- Kullanıcının girdisi:
{{details}}

ÇIKTI FORMATI:
- Cevabın geçerli bir JSON nesnesi OLMALIDIR.
- Tam olarak şu yapıyı kullan: { "reading": "Tam okuman buraya..." }
- "reading" dizesi içinde, biçimlendirme için Markdown kullan (ör. **kalın**, *italik*, ## Başlıklar, - Listeler).
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

function buildSystemInstruction(locale: string, persona: any): string {
  let template = SYSTEM_INSTRUCTION_TEMPLATES[locale] || SYSTEM_INSTRUCTION_TEMPLATES['en'];
  template = template.replace(/{{persona_name}}/g, persona.display_name?.[locale] || persona.id);
  template = template.replace(/{{persona_style}}/g, (persona.style?.[locale] || []).join(', ') || 'wijs en inzichtelijk');
  template = template.replace(/{{persona_prompt_template}}/g, persona.prompt_template || '');
  return template;
}

function buildUserPrompt(locale: string, method: string, payload: any): string {
  if (method === 'tarot') {
    let prompt = TAROT_USER_PROMPT_TEMPLATES[locale] || TAROT_USER_PROMPT_TEMPLATES['en'];
    const orientationText = {
      nl: { upright: 'Rechtop', reversed: 'Omgekeerd' },
      en: { upright: 'Upright', reversed: 'Reversed' },
      tr: { upright: 'Düz', reversed: 'Ters' },
    };
    const cardsList = payload.cards.map((c: any) => 
      `- Kaart ${c.index} (${c.position_title}): ${c.name} (${c.upright ? orientationText[locale].upright : orientationText[locale].reversed})`
    ).join('\n');
    const userQuestion = payload.userQuestion || (locale === 'nl' ? "Geef een algemene lezing over de huidige situatie." : "Give a general reading about the current situation.");

    prompt = prompt.replace(/{{user_question}}/g, userQuestion);
    prompt = prompt.replace(/{{spread_name}}/g, payload.spread.name);
    prompt = prompt.replace(/{{cards_list}}/g, cardsList);
    
    return prompt;
  } else {
    let prompt = OTHER_METHOD_USER_PROMPT_TEMPLATES[locale] || OTHER_METHOD_USER_PROMPT_TEMPLATES['en'];
    
    let details = "";
    if (method === 'koffiedik' || method === 'coffee') {
      const symbols = payload.symbols.map((s:any) => `- ${s[`symbol_name_${locale}`] || s.symbol_name_nl}: ${s[`description_${locale}`] || s.description_nl}`).join('\n');
      details = `Symbolen:\n${symbols}`;
    } else if (method === 'dromen' || method === 'dream') {
      details = `Droom: ${payload.userQuestion}`;
    } else if (method === 'numerologie' || method === 'numerology') {
      details = `Naam: ${payload.numerologyData.fullName}, Geboortedatum: ${payload.numerologyData.birthDate}`;
    }

    prompt = prompt.replace(/{{method}}/g, method);
    prompt = prompt.replace(/{{details}}/g, details);

    return prompt;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const raw = await req.json();
    const body = BodySchema.parse(raw);

    // Try to get user, but don't fail if they're not logged in.
    const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
    // We ignore authError here and just check if user is null.

    const persona = await getPersona(supabaseAdmin, body.personaId);
    const systemInstruction = buildSystemInstruction(body.locale, persona);
    const userPrompt = buildUserPrompt(body.locale, body.method, body.payload);

    const genAI = new GoogleGenerativeAI(env('GEMINI_API_KEY'));
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();
    const resultJson = JSON.parse(text);

    // Only save the reading if the user is authenticated.
    if (user) {
      let readingTitle: string;
      const { method, payload, locale } = body;
      switch (method) {
        case 'tarot':
          readingTitle = payload.spread.name?.[locale] || payload.spread.name?.['nl'] || payload.spread.id;
          break;
        case 'koffiedik':
        case 'coffee':
          if (payload.symbols && payload.symbols.length > 0) {
            const symbolNames = payload.symbols
              .slice(0, 3)
              .map((s: any) => s[`symbol_name_${locale}`] || s.symbol_name_nl)
              .join(', ');
            readingTitle = locale === 'nl' ? `Koffielezing: ${symbolNames}` : `Coffee Reading: ${symbolNames}`;
          } else {
            readingTitle = locale === 'nl' ? 'Koffielezing' : 'Coffee Reading';
          }
          break;
        case 'dromen':
        case 'dream':
          if (payload.userQuestion) {
            const dreamSnippet = payload.userQuestion.split(' ').slice(0, 5).join(' ') + '...';
            readingTitle = locale === 'nl' ? `Droom: ${dreamSnippet}` : `Dream: ${dreamSnippet}`;
          } else {
            readingTitle = locale === 'nl' ? 'Droomduiding' : 'Dream Interpretation';
          }
          break;
        case 'numerologie':
        case 'numerology':
          if (payload.numerologyData?.fullName) {
            readingTitle = locale === 'nl' ? `Numerologie voor ${payload.numerologyData.fullName}` : `Numerology for ${payload.numerologyData.fullName}`;
          } else {
            readingTitle = locale === 'nl' ? 'Numerologie Lezing' : 'Numerology Reading';
          }
          break;
        default:
          readingTitle = method;
      }

      const { error: insertError } = await supabaseAdmin.from('readings').insert({
        user_id: user.id,
        method: body.method,
        locale: body.locale,
        payload: body.payload,
        interpretation: resultJson,
        spread_id: body.method === 'tarot' ? body.payload.spread.id : null,
        title: readingTitle,
      });

      if (insertError) {
        // Log the error but don't fail the request, as the user got their reading.
        console.error("DB insert error:", insertError);
      }
    }

    return new Response(JSON.stringify({ reading: resultJson }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.flatten() : (err as any)?.message || 'Unexpected error';
    console.error("generate-reading error:", msg);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});