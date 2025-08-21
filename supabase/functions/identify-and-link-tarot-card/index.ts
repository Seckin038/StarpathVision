// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.224/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

const genAI = new GoogleGenerativeAI(env('GEMINI_API_KEY'));
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const PROMPT = `
You are an expert in tarot card identification.
Analyze the provided image of a tarot card.
Respond with ONLY the official English name of the card.
Do not add any extra text, explanation, or formatting.

Examples of valid responses:
- The Fool
- Ace of Wands
- Ten of Pentacles
- Knight of Cups
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    
    const formData = await req.formData();
    const file = formData.get('cardImage');
    if (!file) {
      throw new Error('No image file provided.');
    }

    // 1. Get image data for AI
    const imageBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = file.type;

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType,
      },
    };

    // 2. Ask AI to identify the card
    const result = await model.generateContent([PROMPT, imagePart]);
    const response = result.response;
    const cardName = response.text().trim();

    if (!cardName) {
      throw new Error('AI could not identify the card name.');
    }

    // 3. Find the card in the database using the English name
    const { data: cardData, error: dbError } = await supabaseAdmin
      .from('tarot_cards')
      .select('id, name')
      .ilike('name', cardName) // Case-insensitive search
      .single();

    if (dbError || !cardData) {
      throw new Error(`Card named '${cardName}' not found in the database. ${dbError?.message || ''}`);
    }

    const cardId = cardData.id;
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${cardId}.${ext}`;

    // 4. Upload the image to Supabase Storage with the correct ID
    const { error: uploadError } = await supabaseAdmin.storage
      .from('tarot-cards')
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // 5. Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('tarot-cards')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 6. Update the card in the database with the new image URL
    const { error: updateError } = await supabaseAdmin
      .from('tarot_cards')
      .update({ image_url: publicUrl })
      .eq('id', cardId);

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      message: 'Card identified and linked successfully.',
      cardName: cardData.name,
      cardId: cardId,
      imageUrl: publicUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error in identify-and-link-tarot-card:', msg);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});