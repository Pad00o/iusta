import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - esm.sh
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// @ts-ignore - esm.sh side-effect import to extend jsPDF prototype
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Strip emojis & unsupported glyphs (Helvetica built-in is Latin1 only)
function clean(s: string): string {
  return s
    // strip extended unicode (emojis, box drawing)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/[•●◆■□▪▫]/g, "-")
    .replace(/[─━═]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function inline(s: string): string {
  return clean(
    s
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
      .replace(/<[^>]+>/g, "")
  );
}

interface Block {
  type: "h1" | "h2" | "h3" | "p" | "li" | "table" | "hr" | "quote";
  text?: string;
  rows?: string[][];
}

function parse(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let tbuf: string[][] = [];
  let pbuf: string[] = [];

  const flushP = () => {
    if (pbuf.length) {
      blocks.push({ type: "p", text: pbuf.join(" ") });
      pbuf = [];
    }
  };
  const flushT = () => {
    if (tbuf.length) {
      blocks.push({ type: "table", rows: tbuf });
      tbuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");

    if (/^\s*\|/.test(line)) {
      flushP();
      const cells = line.split("|").slice(1, -1).map((c) => inline(c.trim()));
      if (cells.every((c) => /^[-:]*$/.test(c))) continue;
      tbuf.push(cells);
      continue;
    } else if (tbuf.length) flushT();

    if (/^# /.test(line)) {
      flushP();
      blocks.push({ type: "h1", text: inline(line.slice(2)) });
    } else if (/^## /.test(line)) {
      flushP();
      blocks.push({ type: "h2", text: inline(line.slice(3)) });
    } else if (/^### /.test(line)) {
      flushP();
      blocks.push({ type: "h3", text: inline(line.slice(4)) });
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushP();
      blocks.push({ type: "li", text: inline(line.replace(/^\s*[-*]\s+/, "")) });
    } else if (/^>\s+/.test(line)) {
      flushP();
      blocks.push({ type: "quote", text: inline(line.replace(/^>\s+/, "")) });
    } else if (line.trim() === "---" || line.trim() === "***") {
      flushP();
      blocks.push({ type: "hr" });
    } else if (line.trim() === "") {
      flushP();
    } else {
      pbuf.push(inline(line));
    }
  }
  flushP();
  flushT();
  return blocks;
}

function buildPdf(markdown: string, titoloPratica?: string): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const marginTop = 25;
  const marginBottom = 20;
  const contentW = pageW - marginX * 2;
  let y = marginTop;

  const ensure = (h: number) => {
    if (y + h > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  // Header on every page (drawn after content via callback would be ideal; do at end)
  const drawHeaderFooter = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 54, 93);
      doc.text("IUSTA", marginX, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Report di Analisi Tecnico-Giuridica", pageW - marginX, 14, { align: "right" });
      doc.setDrawColor(26, 54, 93);
      doc.setLineWidth(0.4);
      doc.line(marginX, 17, pageW - marginX, 17);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Pagina ${i} di ${total}`, pageW / 2, pageH - 10, { align: "center" });
      doc.text(
        `Generato il ${new Date().toLocaleString("it-IT")}`,
        marginX,
        pageH - 10
      );
    }
  };

  // Cover/title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93);
  doc.text("Report di Analisi", marginX, y);
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  if (titoloPratica) {
    doc.text(`Pratica: ${clean(titoloPratica)}`, marginX, y);
    y += 6;
  }
  doc.text(`Data: ${new Date().toLocaleDateString("it-IT")}`, marginX, y);
  y += 10;
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageW - marginX, y);
  y += 8;

  const blocks = parse(markdown);

  for (const b of blocks) {
    if (b.type === "h1") {
      ensure(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(26, 54, 93);
      const lines = doc.splitTextToSize(b.text!, contentW);
      doc.text(lines, marginX, y);
      y += lines.length * 7 + 2;
      doc.setDrawColor(26, 54, 93);
      doc.setLineWidth(0.4);
      doc.line(marginX, y, pageW - marginX, y);
      y += 5;
    } else if (b.type === "h2") {
      ensure(11);
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(26, 54, 93);
      const lines = doc.splitTextToSize(b.text!, contentW);
      doc.text(lines, marginX, y);
      y += lines.length * 6 + 3;
    } else if (b.type === "h3") {
      ensure(9);
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(45, 74, 122);
      const lines = doc.splitTextToSize(b.text!, contentW);
      doc.text(lines, marginX, y);
      y += lines.length * 5.5 + 2;
    } else if (b.type === "p") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(b.text!, contentW);
      for (const line of lines) {
        ensure(6);
        doc.text(line, marginX, y);
        y += 5.5;
      }
      y += 1.5;
    } else if (b.type === "li") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(b.text!, contentW - 6);
      ensure(6);
      doc.text("•", marginX + 1, y);
      lines.forEach((line: string, i: number) => {
        if (i > 0) ensure(6);
        doc.text(line, marginX + 6, y);
        y += 5.5;
      });
    } else if (b.type === "quote") {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(b.text!, contentW - 8);
      const blockH = lines.length * 5.5 + 4;
      ensure(blockH);
      doc.setFillColor(252, 248, 230);
      doc.rect(marginX, y - 4, contentW, blockH, "F");
      doc.setDrawColor(217, 184, 90);
      doc.setLineWidth(1.2);
      doc.line(marginX, y - 4, marginX, y - 4 + blockH);
      lines.forEach((line: string) => {
        doc.text(line, marginX + 4, y);
        y += 5.5;
      });
      y += 2;
    } else if (b.type === "hr") {
      ensure(4);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(marginX, y, pageW - marginX, y);
      y += 4;
    } else if (b.type === "table" && b.rows) {
      ensure(15);
      const head = [b.rows[0]];
      const body = b.rows.slice(1);
      autoTable(doc, {
        head,
        body,
        startY: y,
        margin: { left: marginX, right: marginX },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, textColor: [30, 30, 30] },
        headStyles: { fillColor: [26, 54, 93], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 248, 252] },
      });
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 4;
    }
  }

  drawHeaderFooter();

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { markdown, titoloPratica, format } = await req.json();
    if (!markdown) {
      return new Response(JSON.stringify({ error: "No markdown" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format "html-public-url" → upload HTML to Storage and return URL (used for Google Docs)
    if (format === "html-public-url") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const html = buildSimpleHtml(markdown, titoloPratica);
      const fname = `report_${crypto.randomUUID()}.html`;
      const upRes = await fetch(`${supabaseUrl}/storage/v1/object/reports/${fname}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "text/html; charset=utf-8",
          "x-upsert": "true",
        },
        body: html,
      });
      if (!upRes.ok) {
        const t = await upRes.text();
        throw new Error("Upload failed: " + t);
      }
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/reports/${fname}`;
      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = buildPdf(markdown, titoloPratica);
    const fileName = (titoloPratica || "IUSTA_Report").replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("generate-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSimpleHtml(md: string, titolo?: string): string {
  // Minimal HTML for Google Docs Viewer / import
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\s*)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titolo || "IUSTA Report"}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a;max-width:800px;margin:2em auto;padding:0 1em}
h1{color:#1a365d;border-bottom:2px solid #1a365d;padding-bottom:6px;font-size:20pt}
h2{color:#1a365d;margin-top:1.5em;font-size:15pt}
h3{color:#2d4a7a;font-size:13pt}
table{border-collapse:collapse;width:100%;margin:1em 0}
td,th{border:1px solid #ccc;padding:6px 10px;vertical-align:top}
th{background:#f0f4fa}</style></head><body>
<h1>IUSTA — Report di Analisi Tecnico-Giuridica</h1>
${titolo ? `<p><strong>Pratica:</strong> ${titolo}</p>` : ""}
<p><strong>Data:</strong> ${new Date().toLocaleDateString("it-IT")}</p>
<hr/><p>${html}</p>
</body></html>`;
}
