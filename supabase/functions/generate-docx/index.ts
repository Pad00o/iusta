import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple markdown to structured data parser
function parseMarkdown(md: string) {
  const lines = md.split("\n");
  const sections: { type: string; content: string; level?: number }[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      sections.push({ type: "heading", content: line.slice(4).trim(), level: 3 });
    } else if (line.startsWith("## ")) {
      sections.push({ type: "heading", content: line.slice(3).trim(), level: 2 });
    } else if (line.startsWith("# ")) {
      sections.push({ type: "heading", content: line.slice(2).trim(), level: 1 });
    } else if (line.startsWith("|") && !line.match(/^\|[\s-:|]+\|$/)) {
      // Table row (not separator)
      const cells = line.split("|").filter((c) => c.trim() !== "").map((c) => c.trim());
      sections.push({ type: "table-row", content: cells.join("||") });
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      sections.push({ type: "list-item", content: line.slice(2).trim() });
    } else if (line.trim()) {
      sections.push({ type: "paragraph", content: line.trim() });
    }
  }

  return sections;
}

// Build HTML document for DOCX-like output (using HTML that can be opened by Word)
function markdownToWordHtml(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="color:#1a365d;font-size:13pt;margin-top:20px;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="color:#1a365d;font-size:15pt;margin-top:24px;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="color:#1a365d;font-size:18pt;border-bottom:2px solid #1a365d;padding-bottom:6px;">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Highlight items with emojis
  html = html.replace(/^- ⚠️ (.+)$/gm, '<p style="background:#FFF3CD;border-left:4px solid #FFC107;padding:8px 12px;margin:6px 0;">⚠️ $1</p>');
  html = html.replace(/^- ⚖️ (.+)$/gm, '<p style="background:#D1ECF1;border-left:4px solid #17A2B8;padding:8px 12px;margin:6px 0;">⚖️ $1</p>');
  html = html.replace(/^- 🛠️ (.+)$/gm, '<p style="background:#F8D7DA;border-left:4px solid #DC3545;padding:8px 12px;margin:6px 0;">🛠️ $1</p>');

  // List items
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;">$1</li>');
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="margin:8px 0;padding-left:24px;">$1</ul>');

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split("|").filter((c) => c.trim() !== "").map((c) => c.trim());
    if (cells.every((c) => /^[-:]+$/.test(c))) return "<!--sep-->";
    return "<tr>" + cells.map((c) => `<td style="border:1px solid #ccc;padding:6px 10px;">${c}</td>`).join("") + "</tr>";
  });
  html = html.replace(/((<tr>.*<\/tr>\n?)+)/g, '<table style="border-collapse:collapse;width:100%;margin:12px 0;">$1</table>');
  html = html.replace(/<!--sep-->\n?/g, "");

  // Paragraphs
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
    const { markdown, titoloPratica } = await req.json();
    if (!markdown) {
      return new Response(JSON.stringify({ error: "No markdown provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyHtml = markdownToWordHtml(markdown);
    const dateStr = new Date().toLocaleDateString("it-IT");
    const dateTimeStr = new Date().toLocaleString("it-IT");

    // Word-compatible HTML with mso namespace
    const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8"/>
<meta name="ProgId" content="Word.Document"/>
<meta name="Generator" content="IUSTA Legal Analysis"/>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 18pt; color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 6px; }
  h2 { font-size: 15pt; color: #1a365d; margin-top: 24px; }
  h3 { font-size: 13pt; color: #2d4a7a; margin-top: 20px; }
  strong { color: #c53030; }
  table { font-size: 10pt; border-collapse: collapse; width: 100%; }
  td, th { vertical-align: top; border: 1px solid #ccc; padding: 6px 10px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a365d; padding-bottom: 15px; }
  .header h1 { border: none; margin: 0; }
  .footer { text-align: center; font-size: 9pt; color: #666; margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <h1>⚖️ IUSTA</h1>
  <p style="color:#444;margin:4px 0 0;font-size:12pt;font-weight:bold;">Report di Analisi Tecnico-Giuridica</p>
  ${titoloPratica ? `<p style="color:#666;margin:4px 0 0;">Pratica: ${titoloPratica}</p>` : ""}
  <p style="color:#666;margin:4px 0 0;">Data: ${dateStr}</p>
</div>
${bodyHtml}
<div class="footer">
  Documento generato da IUSTA — Analisi Infortunistica Stradale<br/>
  Generato il ${dateTimeStr}
</div>
</body>
</html>`;

    const fileName = titoloPratica
      ? `IUSTA_Report_${titoloPratica.replace(/[^a-zA-Z0-9]/g, "_")}.doc`
      : "IUSTA_Report.doc";

    return new Response(fullHtml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/msword",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("generate-docx error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
