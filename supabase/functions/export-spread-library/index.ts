// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    const { data: allSpreads, error: spreadsError } = await supabaseAdmin.from("spreads").select("*").order("id");
    if (spreadsError) throw spreadsError;

    const entries = [];
    for (const s of allSpreads) {
      const { data: pos, error: posError } = await supabaseAdmin.from("spread_positions").select("*").eq("spread_id", s.id).order("idx");
      if (posError) throw posError;

      entries.push({
        id: s.id,
        cards_required: s.cards_required,
        allow_reversals: s.allow_reversals,
        name: s.name,
        ui_copy: s.ui_copy,
        positions: (pos || []).map((p: any) => ({
          slot_key: p.slot_key,
          idx: p.idx,
          x: Number(p.x),
          y: Number(p.y),
          rot: Number(p.rot),
          title: p.title,
          upright_copy: p.upright_copy,
          reversed_copy: p.reversed_copy,
        })),
      });
    }

    const json = JSON.stringify({ spreads: entries }, null, 2);
    const { error: uploadError } = await supabaseAdmin.storage
      .from("config")
      .upload("tarot/spread-library.json", new Blob([json], { type: "application/json" }), { upsert: true });

    if (uploadError) throw uploadError;

    try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
        if (user) {
            await supabaseAdmin.from("audit_logs").insert({ action: "export_spread_library_auto", meta: { count: entries.length }, user_id: user.id });
        }
    } catch(e) { /* ignore logging error */ }


    return new Response(JSON.stringify({ message: "spread-library.json has been updated.", count: entries.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});