import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { token, password } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "token richiesto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: share, error: shareErr } = await supabase
      .from("shared_reports")
      .select("id, case_id, password_hash, expires_at")
      .eq("token", token)
      .maybeSingle();
    if (shareErr) throw shareErr;
    if (!share) {
      return new Response(JSON.stringify({ error: "Link non valido" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Link scaduto" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (share.password_hash) {
      if (!password) {
        return new Response(JSON.stringify({ passwordRequired: true }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const incoming = await sha256(String(password));
      if (incoming !== share.password_hash) {
        return new Response(JSON.stringify({ error: "Password errata" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: kase, error: kaseErr } = await supabase
      .from("cases")
      .select("id, title, titolo_pratica, numero_pratica, messages, uploaded_files, report_summary, created_at")
      .eq("id", share.case_id)
      .maybeSingle();
    if (kaseErr) throw kaseErr;
    if (!kase) {
      return new Response(JSON.stringify({ error: "Caso non trovato" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("shared_reports")
      .update({ view_count: (await supabase.from("shared_reports").select("view_count").eq("id", share.id).maybeSingle()).data?.view_count + 1 || 1 })
      .eq("id", share.id);

    return new Response(
      JSON.stringify({
        case: kase,
        expires_at: share.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("get-shared-report error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
