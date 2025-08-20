import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Input Validation Schema ---
const CardSchema = z.object({
  index: z.number(),
  name: z.string(),
  upright: z.boolean(),
  position_key: z.string(),
  position_title: z.string(),
});

const BodySchema = z.object({
  locale: z.enum(["nl", "en", "tr"]),
  spread: z.object({
    id: z.string(),
    name: z.string(),
  }),
  spreadGuide: z.string(),
  cards: z.array(CardSchema),
});

// --- Prompt Engineering ---
function buildPrompt(data: z.infer<typeof BodySchema>): string {
  const langMap = {
    nl: {
      role: "Je bent een ervaren, inzichtelijke en empathische tarot-expert. Je geeft diepgaande, poëtische en constructieve duidingen.",
      instruction: "Analyseer de volgende tarotkaarten binnen de context van de '${data.spread.name}' legging. Geef een complete duiding in JSON-formaat. De JSON MOET de volgende structuur hebben: { combinedInterpretation: { story: string, advice: string, affirmation: string }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Geef ALLEEN de JSON terug, zonder markdown fences of extra tekst.",
      reversed: "omgekeerd",
    },
    en: {
      role: "You are an experienced, insightful, and empathetic tarot expert. You provide deep, poetic, and constructive interpretations.",
      instruction: "Analyze the following tarot cards within the context of the '${data.spread.name}' spread. Provide a complete interpretation in JSON format. The JSON MUST have the following structure: { combinedInterpretation: { story: string, advice: string, affirmation: string }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. Return ONLY the JSON, without markdown fences or extra text.",
      reversed: "reversed",
    },
    tr: {
      role: "Deneyimli, anlayışlı ve empatik bir tarot uzmanısınız. Derin, şiirsel ve yapıcı yorumlar sunuyorsunuz.",
      instruction: "Aşağıdaki tarot kartlarını '${data.spread.name}' açılımı bağlamında analiz edin. JSON formatında eksiksiz bir yorum sağlayın. JSON MUTLAKA şu yapıya sahip olmalıdır: { combinedInterpretation: { story: string, advice: string, affirmation: string }, cardInterpretations: [{ cardName: string, positionTitle: string, isReversed: boolean, shortMeaning: string, longMeaning: string, keywords: string[] }] }. SADECE JSON'u, markdown işaretleri veya ek metin olmadan döndürün.",
      reversed: "ters",
    },
  };

  const t = langMap[data.locale];
  const cardDetails = data.cards
    .map(
      (c) =>
        `- Card ${c.index}: ${c.name} ${c.upright ? "" : `(${t.reversed})`} at position '${c.position_title}'`
    )
    .join("\n");

  return `${t.role}\n${t.instruction}\n\nSpread: ${data.spread.name}\nGuide: ${data.spreadGuide}\n\nCards:\n${cardDetails}`;
}

// --- Main Server Logic ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validatedBody = BodySchema.parse(body);

    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = buildPrompt(validatedBody);
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean the response to ensure it's valid JSON
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonData = JSON.parse(text);

    // --- Save reading for authenticated users ---
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
          language: validatedBody.locale,
          input: {
            spread: validatedBody.spread,
            cards: validatedBody.cards,
          },
          output: jsonData,
          model: 'gemini-1.5-flash-latest',
        });
      }
    } catch (dbError) {
      console.error("Failed to save reading to DB (this is non-critical):", dbError.message);
    }

    return new Response(JSON.stringify(jsonData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in interpret-tarot function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof z.ZodError ? 400 : 500,
    });
  }
});