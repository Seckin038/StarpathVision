// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Robust CORS handling from your guide
const CORS = (req: Request) => {
  const origin = req.headers.get("Origin") ?? "*";
  const acrh = req.headers.get("Access-Control-Request-Headers") ??
    "authorization, x-client-info, apikey, content-type";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": acrh,
  };
};

Deno.serve(async (req: Request) => {
  const corsHeaders = CORS(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Env vars check
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing env SUPABASE_URL or SERVICE_KEY");
    }

    // Payload validation
    const { filePath } = await req.json();
    if (!filePath || typeof filePath !== "string") {
      throw new Error("filePath (string) is required in the request body.");
    }

    // Supabase Admin API headers
    const sbHeaders = {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    };

    // 1. Download file from temporary bucket
    const tmpBucket = "tarot-card-uploads";
    const getUrl = `${SUPABASE_URL}/storage/v1/object/${tmpBucket}/${filePath}`;
    const getRes = await fetch(getUrl, { headers: sbHeaders });
    if (!getRes.ok) {
      throw new Error(`Failed to download from temp storage: ${getRes.status} ${await getRes.text()}`);
    }
    const blob = await getRes.blob();

    // 2. Determine card ID from filename
    const guessedId = filePath.split("/").pop()!.replace(/\.[^/.]+$/, "");
    const ext = filePath.split(".").pop()?.toLowerCase() || "png";
    
    const restIdUrl = `${SUPABASE_URL}/rest/v1/tarot_cards?id=eq.${encodeURIComponent(guessedId)}&select=id`;
    const cardRes = await fetch(restIdUrl, { headers: { ...sbHeaders, "Content-Type": "application/json" } });
    if (!cardRes.ok) throw new Error(`DB query failed: ${cardRes.status} ${await cardRes.text()}`);
    const cardData = await cardRes.json();
    
    if (!cardData || cardData.length === 0) {
        throw new Error(`Card with ID '${guessedId}' not found in the database.`);
    }
    const cardId = cardData[0].id;
    const finalName = `${cardId}.${ext}`;

    // 3. Upload to final public bucket
    const targetBucket = "tarot-cards";
    const putUrl = `${SUPABASE_URL}/storage/v1/object/${targetBucket}/${finalName}`;
    const putRes = await fetch(putUrl, {
      method: "POST",
      headers: {
        ...sbHeaders,
        "Content-Type": blob.type || "application/octet-stream",
        "x-upsert": "true",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: blob,
    });
    if (!putRes.ok) {
      throw new Error(`Failed to upload to final storage: ${putRes.status} ${await putRes.text()}`);
    }

    // 4. Get public URL and update database
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${finalName}`;
    const restUpdateUrl = `${SUPABASE_URL}/rest/v1/tarot_cards?id=eq.${cardId}`;
    const patchRes = await fetch(restUpdateUrl, {
      method: "PATCH",
      headers: {
        ...sbHeaders,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ image_url: publicUrl }),
    });
    if (!patchRes.ok) {
      throw new Error(`Failed to update database: ${patchRes.status} ${await patchRes.text()}`);
    }

    // 5. Clean up temporary file
    const delUrl = `${SUPABASE_URL}/storage/v1/object/${tmpBucket}/${filePath}`;
    await fetch(delUrl, { method: "DELETE", headers: sbHeaders }); // Fire and forget

    // Success
    return new Response(JSON.stringify({ ok: true, message: `Processed ${guessedId}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (e) {
    console.error("Edge Function Error:", e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});