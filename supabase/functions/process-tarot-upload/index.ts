// @ts-nocheck
// Deno Edge Function
// supabase/functions/process-tarot-upload/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Helpers: CORS
function corsHeadersFromRequest(req: Request) {
  const origin = req.headers.get("Origin") ?? "*";
  const acrh = req.headers.get("Access-Control-Request-Headers") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    // Reflecteer ALLE headers die de browser vraagt
    "Access-Control-Allow-Headers": acrh,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFromRequest(req);

  // 1) Preflight vroeg beantwoorden
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors, status: 200 });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 2) Env lezen BINNEN handler (voorkomt top-level crashes)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PROJECT_URL = SUPABASE_URL.replace("https://", "");
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing env SUPABASE_URL or SERVICE_KEY");
    }

    // 3) Payload
    const { filePath } = await req.json().catch(() => ({}));
    if (!filePath || typeof filePath !== "string") {
      return new Response(JSON.stringify({ error: "filePath required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 4) Supabase Admin API: gebruik service key (om RLS te omzeilen)
    const sbHeaders = {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    };

    // 4a) Bestandsdata uit tijdelijke bucket lezen
    const tmpBucket = "tarot-card-uploads";
    const getUrl = `https://${PROJECT_URL}/storage/v1/object/${tmpBucket}/${encodeURIComponent(filePath)}`;
    const getRes = await fetch(getUrl, { headers: sbHeaders });
    if (!getRes.ok) {
      const txt = await getRes.text();
      throw new Error(`Download failed: ${getRes.status} ${txt}`);
    }
    const blob = await getRes.blob();

    // 4b) (Optioneel) kaartnaam bepalen (AI/heuristiek). Hier simpel:
    const guessed = (filePath.split("/").pop() || "card.png").replace(/\.[^/.]+$/, "");
    const ext = (filePath.split(".").pop()?.toLowerCase() || "png");
    
    const { data: card, error: findErr } = await fetch(`${SUPABASE_URL}/rest/v1/tarot_cards?name->>en=ilike.${encodeURIComponent(guessed.replace(/_/g, ' '))}&select=id`, { headers: sbHeaders }).then(r => r.json());
    
    if (findErr || !card || card.length === 0) {
        throw new Error(`Card '${guessed}' not found in DB.`);
    }
    const cardId = card[0].id;
    const finalName = `${cardId}.${ext}`;

    // 4c) Upload naar definitieve, publieke bucket
    const targetBucket = "tarot-cards";
    const putUrl = `https://${PROJECT_URL}/storage/v1/object/${targetBucket}/${encodeURIComponent(finalName)}`;
    const putRes = await fetch(putUrl, {
      method: "POST",
      headers: {
        ...sbHeaders,
        "Content-Type": blob.type || "application/octet-stream",
        "x-upsert": "true", // Use upsert to overwrite existing images for a card
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: blob,
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      throw new Error(`Upload failed: ${putRes.status} ${txt}`);
    }

    // 4d) Publieke URL opbouwen (vereist public READ policy)
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${targetBucket}/${encodeURIComponent(finalName)}`;

    // 4e) DB bijwerken (tarot_cards.image_url)
    const restUrl = `${SUPABASE_URL}/rest/v1/tarot_cards?id=eq.${cardId}`;
    const patchRes = await fetch(restUrl, {
      method: "PATCH",
      headers: {
        ...sbHeaders,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ image_url: publicUrl }),
    });
    if (!patchRes.ok) {
      const txt = await patchRes.text();
      throw new Error(`DB update failed: ${patchRes.status} ${txt}`);
    }

    // 4f) Opruimen — tijdelijk object deleten
    const delUrl = `https://${PROJECT_URL}/storage/v1/object/${tmpBucket}/${encodeURIComponent(filePath)}`;
    await fetch(delUrl, { method: "DELETE", headers: sbHeaders }); // ignore failure

    // 5) Klaar
    return new Response(JSON.stringify({ ok: true, image_url: publicUrl, message: "Processed" }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    // Belangrijk: ALTIJD CORS‑headers meesturen, ook bij errors
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});