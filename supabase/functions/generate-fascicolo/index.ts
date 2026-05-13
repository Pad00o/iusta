// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import JSZip from "https://esm.sh/jszip@3.10.1";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { markdown, titoloPratica, caseId } = await req.json();
    if (!markdown) {
      return new Response(JSON.stringify({ error: "Missing markdown" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Generate PDF
    const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ markdown, titoloPratica }),
    });
    if (!pdfRes.ok) throw new Error(`PDF generation failed: ${pdfRes.status}`);
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

    // Generate DOCX
    const docxRes = await fetch(`${supabaseUrl}/functions/v1/generate-docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ markdown, titoloPratica }),
    });
    if (!docxRes.ok) throw new Error(`DOCX generation failed: ${docxRes.status}`);
    const docxBytes = new Uint8Array(await docxRes.arrayBuffer());

    const safeTitle = (titoloPratica || "IUSTA_Pratica").replace(/[^a-zA-Z0-9]/g, "_");

    const zip = new JSZip();
    zip.file(`${safeTitle}/Report.pdf`, pdfBytes);
    zip.file(`${safeTitle}/Bozza_Atto_di_Citazione.docx`, docxBytes);

    // Try to fetch original uploaded files for the case
    const docs: { name: string; bytes: Uint8Array }[] = [];
    if (caseId) {
      try {
        const { data: caseRow } = await supabase.from("cases").select("uploaded_files").eq("id", caseId).maybeSingle();
        const uploaded: any[] = (caseRow?.uploaded_files as any) || [];
        for (const f of uploaded) {
          try {
            const { data, error } = await supabase.storage.from("case-files").download(f.path);
            if (error || !data) continue;
            const buf = new Uint8Array(await data.arrayBuffer());
            docs.push({ name: f.name || f.path.split("/").pop(), bytes: buf });
            zip.file(`${safeTitle}/Documenti_Originali/${f.name || f.path.split("/").pop()}`, buf);
          } catch (e) { console.warn("doc fetch failed", e); }
        }
      } catch (e) { console.warn("case lookup failed", e); }
    }

    const indice = [
      `IUSTA — Fascicolo Pro`,
      `Pratica: ${titoloPratica || "(senza titolo)"}`,
      `Generato il: ${new Date().toLocaleString("it-IT")}`,
      ``,
      `Contenuto del fascicolo:`,
      `  • Report.pdf — Analisi tecnico-giuridica completa`,
      `  • Bozza_Atto_di_Citazione.docx — Bozza Word formattata IUSTA`,
      docs.length ? `  • Documenti_Originali/ — ${docs.length} file caricati` : `  • (nessun documento originale allegato)`,
      ``,
      `Documento riservato. Il presente fascicolo è prodotto da IUSTA a supporto`,
      `dell'attività professionale. Ogni valutazione finale resta in capo al legale.`,
    ].join("\n");
    zip.file(`${safeTitle}/Indice.txt`, indice);

    const zipBytes: Uint8Array = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    return new Response(zipBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeTitle}_Fascicolo_Pro.zip"`,
      },
    });
  } catch (e) {
    console.error("generate-fascicolo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
