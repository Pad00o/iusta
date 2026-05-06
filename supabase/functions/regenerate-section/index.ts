import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { sectionTitle, currentReport } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!sectionTitle || !currentReport) throw new Error("missing parameters");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Sei IUSTA, Senior Legal Analyst. Rigenera SOLO la sezione richiesta del report mantenendo la stessa intestazione markdown. Rispondi unicamente con la sezione rigenerata in markdown italiano professionale." },
          { role: "user", content: `Report attuale:\n\n${currentReport}\n\n---\n\nRigenera SOLO la sezione: "${sectionTitle}". Mantieni lo stesso heading. Migliora chiarezza, profondità e citazioni delle fonti.` },
        ],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const section = j.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ section }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("regenerate-section error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
