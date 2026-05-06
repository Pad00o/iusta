import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { caseId, report } = await req.json();
    if (!report) throw new Error("missing report");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Sei un assistente legale. Estrai dal report fornito esattamente 3 bullet point chiave (massimo 15 parole ciascuno). Rispondi SOLO con i 3 bullet, formato markdown '- '. Niente altro testo." },
          { role: "user", content: report.slice(0, 8000) },
        ],
      }),
    });
    const j = await r.json();
    const summary = j.choices?.[0]?.message?.content?.trim() || "";

    if (caseId && summary) {
      const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supa.from("cases").update({ report_summary: summary, status: "completato" }).eq("id", caseId);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-case error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
