import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      readingType,
      language,
      persona,
      cards,
      symbols,
      userQuestion
    } = await req.json();

    let content = `Je bent ${persona.name}, een ${persona.description}. `;
    content += `Je achtergrond is: ${persona.background}. `;
    content += `Je specialisaties zijn: ${persona.specializations.join(', ')}. `;
    content += `Genereer een waarzegging in de taal: ${language}. `;
    content += `De gebruiker heeft een ${readingType} lezing gedaan. `;

    if (cards && cards.length > 0) {
      const cardDetails = cards.map((c: any) => `${c.position}: ${c.card.name} (Betekenis: ${c.card.meaning_up})`).join(', ');
      content += `De getrokken kaarten zijn: ${cardDetails}. `;
    }

    if (symbols && symbols.length > 0) {
      const symbolDetails = symbols.map((s: any) => `${s['Symbool NL']}: ${s['Betekenis NL']}`).join(', ');
      content += `De gekozen symbolen zijn: ${symbolDetails}. `;
    }

    if (userQuestion) {
      content += `De vraag van de gebruiker is: "${userQuestion}". `;
    }

    content += "Geef een diepgaande, inzichtelijke en poëtische interpretatie gebaseerd op deze informatie. Spreek direct tot de gebruiker ('je', 'jouw'). De toon moet mysterieus en wijs zijn. Geef alleen de waarzegging terug, zonder extra opmaak of inleidende zinnen zoals 'Hier is je lezing:'.";

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: content }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const readingText = geminiData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reading: readingText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});