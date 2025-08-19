// @ts-ignore: Deno is a global in the Supabase Edge Function environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno is a global in the Supabase Edge Function environment
import { requireEnv } from "../../../src/utils/env.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore: Deno is a global in the Supabase Edge Function environment
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in Supabase secrets.");
      throw new Error("De AI-configuratie aan de server-kant ontbreekt. Controleer de API-sleutel.");
    }
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const body = await req.json();
    console.log("Received request for reading:", JSON.stringify(body, null, 2));

    const {
      readingType,
      language,
      persona,
      cards,
      symbols,
      numerologyData,
      userQuestion
    } = body;

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

    if (readingType === "Numerologie" && numerologyData) {
      content += `De gebruiker heeft de volgende gegevens ingevoerd: Geboortedatum: ${numerologyData.birthDate}, Volledige naam: ${numerologyData.fullName}. `;
      content += `Bereken de kerngetallen (Levenspad, Bestemming, Zielsverlangen) en geef een persoonlijke, diepgaande numerologische lezing gebaseerd op deze getallen.`;
    }

    if (userQuestion) {
      content += `De vraag van de gebruiker is: "${userQuestion}". `;
    }

    content += "Geef een diepgaande, inzichtelijke en poëtische interpretatie gebaseerd op deze informatie. Spreek direct tot de gebruiker ('je', 'jouw'). De toon moet mysterieus en wijs zijn. Geef alleen de waarzegging terug, zonder extra opmaak of inleidende zinnen zoals 'Hier is je leking:'.";
    
    console.log("Sending prompt to Gemini...");

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: content }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API Error:", errorBody);
      throw new Error(`Fout bij de AI API: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const readingText = geminiData.candidates[0].content.parts[0].text;
    
    console.log("Successfully received reading from Gemini.");

    return new Response(JSON.stringify({ reading: readingText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // @ts-ignore: Deno is a global in the Supabase Edge Function environment
    console.error("Edge function error:", error.message);
    // @ts-ignore: Deno is a global in the Supabase Edge Function environment
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});