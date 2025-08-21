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
  let prompt = persona.prompt_template || "Je bent een behulpzame assistent.";

  // Replace placeholders
  prompt = prompt.replace(/{{locale}}/g, locale);
  prompt = prompt.replace(/{{method}}/g, method);
  
  let details = "";
  if (method === 'tarot') {
    const cards = payload.cards.map(c => `- ${c.name} (${c.upright ? 'rechtop' : 'omgekeerd'}) @ ${c.position_title}`).join('\n');
    details = `Legging: ${payload.spread.name}\nKaarten:\n${cards}`;
  } else if (method === 'koffiedik') {
    const symbols = payload.symbols.map(s => `- ${s[`symbol_name_${locale}`]}: ${s[`description_${locale}`]}`).join('\n');
    details = `Symbolen:\n${symbols}`;
  } else if (method === 'dromen') {
    details = `Droom: ${payload.userQuestion}`;
  } else if (method === 'numerologie') {
    details = `Naam: ${payload.numerologyData.fullName}, Geboortedatum: ${payload.numerologyData.birthDate}`;
  }
  
  prompt = prompt.replace(/{{details}}/g, details);
  prompt = prompt.replace(/{{vraag}}/g, payload.userQuestion || "Geef een algemene lezing.");

  return prompt;
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