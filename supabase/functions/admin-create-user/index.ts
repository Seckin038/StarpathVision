// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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

    // 1. Get the calling user from their token
    const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(
      req.headers.get("Authorization")?.replace("Bearer ", "")
    );

    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 2. Check if the calling user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Caller is not an admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // 3. Get the new user details from the request body
    const { email, password, sendInvite, role } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Bad Request: email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 4. Create the user
    let userResponse;
    if (sendInvite) {
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        if (error) throw error;
        userResponse = data;
    } else {
        if (!password) {
            return new Response(JSON.stringify({ error: "Bad Request: password is required when not sending an invite" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (error) throw error;
        userResponse = data;
    }

    // 5. Set the role for the new user
    const newUser = userResponse.user;
    if (newUser && role) {
        // The handle_new_user trigger creates the profile, so we update it.
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: role })
            .eq('id', newUser.id);
        if (profileUpdateError) {
            console.warn(`User ${newUser.id} created, but failed to set role to '${role}':`, profileUpdateError.message);
        }
    }

    // 6. Log the action
    await supabaseAdmin.from("audit_logs").insert({
      action: "admin_create_user",
      meta: { created_user_email: email, send_invite: sendInvite, role: role },
      user_id: caller.id,
    });

    return new Response(JSON.stringify({ message: "User created successfully.", user: userResponse.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error creating user:", msg);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});