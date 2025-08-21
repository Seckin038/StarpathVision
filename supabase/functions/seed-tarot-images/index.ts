// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// The CSV data provided by the user is embedded here for reliability.
const CSV_DATA = `name,suit,number,wikimedia_link
The Fool,Major Arcana,0,https://commons.wikimedia.org/wiki/File:RWS_Tarot_00_Fool.jpg
The Magician,Major Arcana,1,https://commons.wikimedia.org/wiki/File:RWS_Tarot_01_Magician.jpg
The High Priestess,Major Arcana,2,https://commons.wikimedia.org/wiki/File:RWS_Tarot_02_High_Priestess.jpg
The Empress,Major Arcana,3,https://commons.wikimedia.org/wiki/File:RWS_Tarot_03_Empress.jpg
The Emperor,Major Arcana,4,https://commons.wikimedia.org/wiki/File:RWS_Tarot_04_Emperor.jpg
The Hierophant,Major Arcana,5,https://commons.wikimedia.org/wiki/File:RWS_Tarot_05_Hierophant.jpg
The Lovers,Major Arcana,6,https://commons.wikimedia.org/wiki/File:RWS_Tarot_06_Lovers.jpg
The Chariot,Major Arcana,7,https://commons.wikimedia.org/wiki/File:RWS_Tarot_07_Chariot.jpg
Strength,Major Arcana,8,https://commons.wikimedia.org/wiki/File:RWS_Tarot_08_Strength.jpg
The Hermit,Major Arcana,9,https://commons.wikimedia.org/wiki/File:RWS_Tarot_09_Hermit.jpg
Wheel of Fortune,Major Arcana,10,https://commons.wikimedia.org/wiki/File:RWS_Tarot_10_Wheel_of_Fortune.jpg
Justice,Major Arcana,11,https://commons.wikimedia.org/wiki/File:RWS_Tarot_11_Justice.jpg
The Hanged Man,Major Arcana,12,https://commons.wikimedia.org/wiki/File:RWS_Tarot_12_Hanged_Man.jpg
Death,Major Arcana,13,https://commons.wikimedia.org/wiki/File:RWS_Tarot_13_Death.jpg
Temperance,Major Arcana,14,https://commons.wikimedia.org/wiki/File:RWS_Tarot_14_Temperance.jpg
The Devil,Major Arcana,15,https://commons.wikimedia.org/wiki/File:RWS_Tarot_15_Devil.jpg
The Tower,Major Arcana,16,https://commons.wikimedia.org/wiki/File:RWS_Tarot_16_Tower.jpg
The Star,Major Arcana,17,https://commons.wikimedia.org/wiki/File:RWS_Tarot_17_Star.jpg
The Moon,Major Arcana,18,https://commons.wikimedia.org/wiki/File:RWS_Tarot_18_Moon.jpg
The Sun,Major Arcana,19,https://commons.wikimedia.org/wiki/File:RWS_Tarot_19_Sun.jpg
Judgement,Major Arcana,20,https://commons.wikimedia.org/wiki/File:RWS_Tarot_20_Judgement.jpg
The World,Major Arcana,21,https://commons.wikimedia.org/wiki/File:RWS_Tarot_21_World.jpg
Ace of Wands,Wands,1,https://commons.wikimedia.org/wiki/File:Wands01.jpg
Two of Wands,Wands,2,https://commons.wikimedia.org/wiki/File:Wands02.jpg
Three of Wands,Wands,3,https://commons.wikimedia.org/wiki/File:Wands03.jpg
Four of Wands,Wands,4,https://commons.wikimedia.org/wiki/File:Wands04.jpg
Five of Wands,Wands,5,https://commons.wikimedia.org/wiki/File:Wands05.jpg
Six of Wands,Wands,6,https://commons.wikimedia.org/wiki/File:Wands06.jpg
Seven of Wands,Wands,7,https://commons.wikimedia.org/wiki/File:Wands07.jpg
Eight of Wands,Wands,8,https://commons.wikimedia.org/wiki/File:Wands08.jpg
Nine of Wands,Wands,9,https://commons.wikimedia.org/wiki/File:Wands09.jpg
Ten of Wands,Wands,10,https://commons.wikimedia.org/wiki/File:Wands10.jpg
Page of Wands,Wands,11,https://commons.wikimedia.org/wiki/File:Wands11.jpg
Knight of Wands,Wands,12,https://commons.wikimedia.org/wiki/File:Wands12.jpg
Queen of Wands,Wands,13,https://commons.wikimedia.org/wiki/File:Wands13.jpg
King of Wands,Wands,14,https://commons.wikimedia.org/wiki/File:Wands14.jpg
Ace of Cups,Cups,1,https://commons.wikimedia.org/wiki/File:Cups01.jpg
Two of Cups,Cups,2,https://commons.wikimedia.org/wiki/File:Cups02.jpg
Three of Cups,Cups,3,https://commons.wikimedia.org/wiki/File:Cups03.jpg
Four of Cups,Cups,4,https://commons.wikimedia.org/wiki/File:Cups04.jpg
Five of Cups,Cups,5,https://commons.wikimedia.org/wiki/File:Cups05.jpg
Six of Cups,Cups,6,https://commons.wikimedia.org/wiki/File:Cups06.jpg
Seven of Cups,Cups,7,https://commons.wikimedia.org/wiki/File:Cups07.jpg
Eight of Cups,Cups,8,https://commons.wikimedia.org/wiki/File:Cups08.jpg
Nine of Cups,Cups,9,https://commons.wikimedia.org/wiki/File:Cups09.jpg
Ten of Cups,Cups,10,https://commons.wikimedia.org/wiki/File:Cups10.jpg
Page of Cups,Cups,11,https://commons.wikimedia.org/wiki/File:Cups11.jpg
Knight of Cups,Cups,12,https://commons.wikimedia.org/wiki/File:Cups12.jpg
Queen of Cups,Cups,13,https://commons.wikimedia.org/wiki/File:Cups13.jpg
King of Cups,Cups,14,https://commons.wikimedia.org/wiki/File:Cups14.jpg
Ace of Swords,Swords,1,https://commons.wikimedia.org/wiki/File:Swords01.jpg
Two of Swords,Swords,2,https://commons.wikimedia.org/wiki/File:Swords02.jpg
Three of Swords,Swords,3,https://commons.wikimedia.org/wiki/File:Swords03.jpg
Four of Swords,Swords,4,https://commons.wikimedia.org/wiki/File:Swords04.jpg
Five of Swords,Swords,5,https://commons.wikimedia.org/wiki/File:Swords05.jpg
Six of Swords,Swords,6,https://commons.wikimedia.org/wiki/File:Swords06.jpg
Seven of Swords,Swords,7,https://commons.wikimedia.org/wiki/File:Swords07.jpg
Eight of Swords,Swords,8,https://commons.wikimedia.org/wiki/File:Swords08.jpg
Nine of Swords,Swords,9,https://commons.wikimedia.org/wiki/File:Swords09.jpg
Ten of Swords,Swords,10,https://commons.wikimedia.org/wiki/File:Swords10.jpg
Page of Swords,Swords,11,https://commons.wikimedia.org/wiki/File:Swords11.jpg
Knight of Swords,Swords,12,https://commons.wikimedia.org/wiki/File:Swords12.jpg
Queen of Swords,Swords,13,https://commons.wikimedia.org/wiki/File:Swords13.jpg
King of Swords,Swords,14,https://commons.wikimedia.org/wiki/File:Swords14.jpg
Ace of Pentacles,Pentacles,1,https://commons.wikimedia.org/wiki/File:Pents01.jpg
Two of Pentacles,Pentacles,2,https://commons.wikimedia.org/wiki/File:Pents02.jpg
Three of Pentacles,Pentacles,3,https://commons.wikimedia.org/wiki/File:Pents03.jpg
Four of Pentacles,Pentacles,4,https://commons.wikimedia.org/wiki/File:Pents04.jpg
Five of Pentacles,Pentacles,5,https://commons.wikimedia.org/wiki/File:Pents05.jpg
Six of Pentacles,Pentacles,6,https://commons.wikimedia.org/wiki/File:Pents06.jpg
Seven of Pentacles,Pentacles,7,https://commons.wikimedia.org/wiki/File:Pents07.jpg
Eight of Pentacles,Pentacles,8,https://commons.wikimedia.org/wiki/File:Pents08.jpg
Nine of Pentacles,Pentacles,9,https://commons.wikimedia.org/wiki/File:Pents09.jpg
Ten of Pentacles,Pentacles,10,https://commons.wikimedia.org/wiki/File:Pents10.jpg
Page of Pentacles,Pentacles,11,https://commons.wikimedia.org/wiki/File:Pents11.jpg
Knight of Pentacles,Pentacles,12,https://commons.wikimedia.org/wiki/File:Pents12.jpg
Queen of Pentacles,Pentacles,13,https://commons.wikimedia.org/wiki/File:Pents13.jpg
King of Pentacles,Pentacles,14,https://commons.wikimedia.org/wiki/File:Pents14.jpg`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    // Security: Check if the user is an admin
    const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
    if (!user) throw new Error("Authentication required.");
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || profile.role !== 'admin') {
      throw new Error("Admin privileges required.");
    }

    const lines = CSV_DATA.trim().split('\n').slice(1); // Skip header
    let updatedCount = 0;
    const errors = [];

    for (const line of lines) {
      const [name, suit, number, link] = line.split(',');
      const fileName = link.split('/').pop();
      if (!fileName) continue;

      // Use Wikimedia API to get direct image URL
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=File:${fileName}`;
      const apiRes = await fetch(apiUrl);
      const apiJson = await apiRes.json();
      const pages = apiJson.query.pages;
      const page = Object.values(pages)[0];
      const imageUrl = page.imageinfo?.[0]?.url;

      if (imageUrl) {
        const { error } = await supabaseAdmin
          .from('tarot_cards')
          .update({ image_url: imageUrl })
          .ilike('name', name); // Case-insensitive match on name

        if (error) {
          errors.push(`Failed to update ${name}: ${error.message}`);
        } else {
          updatedCount++;
        }
      } else {
        errors.push(`Could not find image URL for ${name}`);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Image seeding complete. Updated ${updatedCount} of ${lines.length} cards.`,
      errors: errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});