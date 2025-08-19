import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function env(key: string) {
  const v = (globalThis as any).Deno?.env?.get?.(key);
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const [profileRes, readingsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('user_id', user.id).single(),
      supabaseAdmin.from('readings').select('*').eq('user_id', user.id)
    ]);

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      throw profileRes.error;
    }
    if (readingsRes.error) {
      throw readingsRes.error;
    }

    const userData = {
      profile: profileRes.data,
      readings: readingsRes.data,
    };

    const jsonString = JSON.stringify(userData, null, 2);
    const headers = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="divinatio_data_${user.id}.json"`,
    };

    return new Response(jsonString, { headers, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error exporting user data:", msg);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});