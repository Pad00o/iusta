import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function markdownToHtml(md: string): string {
  let html = md;

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Highlight items
  html = html.replace(/^- ⚠️ (.+)$/gm, '<div style="background:#FFF3CD;border-left:4px solid #FFC107;padding:8px 12px;margin:6px 0;">⚠️ $1</div>');
  html = html.replace(/^- ⚖️ (.+)$/gm, '<div style="background:#D1ECF1;border-left:4px solid #17A2B8;padding:8px 12px;margin:6px 0;">⚖️ $1</div>');
  html = html.replace(/^- 🛠️ (.+)$/gm, '<div style="background:#F8D7DA;border-left:4px solid #DC3545;padding:8px 12px;margin:6px 0;">🛠️ $1</div>');

  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split("|").filter((c) => c.trim() !== "").map((c) => c.trim());
    if (cells.every((c) => /^[-:]+$/.test(c))) return "<!--separator-->";
    return "<tr>" + cells.map((c) => `<td style="border:1px solid #ccc;padding:6px 10px;">${c}</td>`).join("") + "</tr>";
  });
  html = html.replace(/((<tr>.*<\/tr>\n?)+)/g, '<table style="border-collapse:collapse;width:100%;margin:12px 0;">$1</table>');
  html = html.replace(/<!--separator-->\n?/g, "");

  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br/>");
  html = `<p>${html}</p>`;

  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { markdown } = await req.json();
    if (!markdown) {
      return new Response(JSON.stringify({ error: "No markdown provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyHtml = markdownToHtml(markdown);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 18pt; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 6px; }
  h2 { font-size: 15pt; color: #1a365d; margin-top: 24px; }
  h3 { font-size: 13pt; color: #2d4a7a; margin-top: 20px; }
  strong { color: #c53030; }
  table { font-size: 10pt; }
  td { vertical-align: top; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a365d; padding-bottom: 15px; }
  .header h1 { border: none; margin: 0; }
  .footer { text-align: center; font-size: 9pt; color: #666; margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <h1>⚖️ IUSTA</h1>
  <p style="color:#444;margin:4px 0 0;font-size:12pt;font-weight:bold;">Report di Analisi Tecnico-Giuridica</p>
  <p style="color:#666;margin:4px 0 0;">${new Date().toLocaleDateString("it-IT")}</p>
</div>
${bodyHtml}
<div class="footer">
  Documento generato da IUSTA — Analisi Infortunistica Stradale<br/>
  Generato il ${new Date().toLocaleString("it-IT")}
</div>
</body>
</html>`;

    return new Response(fullHtml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "attachment; filename=IUSTA_Report.html",
      },
    });
  } catch (e) {
    console.error("generate-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
