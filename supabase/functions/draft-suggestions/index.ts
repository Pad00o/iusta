// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `Sei un assistente legale specializzato in atti di citazione per infortunistica stradale italiana.
Dato il report tecnico-giuridico fornito, genera 6-8 suggerimenti di scrittura concreti per la redazione dell'atto.
Ogni suggerimento copre una sezione tipica (Oggetto, Parti, Premessa, Svolgimento del fatto, In diritto, Quantificazione del danno, Conclusioni, Istanze istruttorie).
Per ciascuno fornisci: titolo (breve) e snippet (testo bozza pronto da copiare, 2-5 frasi, in italiano forense).
Rispondi SOLO con JSON valido nel formato:
{"suggestions":[{"title":"...","snippet":"..."}]}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { report } = await req.json();
    if (!report) {
      return new Response(JSON.stringify({ error: "Missing report" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Report:\n\n${report.slice(0, 18000)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("draft-suggestions AI error:", resp.status, t);
      throw new Error(`AI gateway ${resp.status}`);
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { /* try to extract */
      const m = content.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
    }
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("draft-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
