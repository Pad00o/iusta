import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { caseId, expiresInHours, password } = await req.json();
    if (!caseId || typeof caseId !== "string") {
      return new Response(JSON.stringify({ error: "caseId richiesto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = randomToken();
    const password_hash = password ? await sha256(String(password)) : null;
    const expires_at =
      expiresInHours && Number.isFinite(expiresInHours)
        ? new Date(Date.now() + Number(expiresInHours) * 3600 * 1000).toISOString()
        : null;

    const { error } = await supabase
      .from("shared_reports")
      .insert({ case_id: caseId, token, password_hash, expires_at });
    if (error) throw error;

    return new Response(JSON.stringify({ token, expires_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-share error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
