// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { marked } from "https://esm.sh/marked@12.0.2";
// @ts-ignore
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// @ts-ignore
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Strip emojis (jsPDF Helvetica is Latin1 only)
function clean(s: string): string {
  if (!s) return "";
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/gu, "")
    .replace(/[•●◆■□▪▫]/g, "•")
    .replace(/[─━═]/g, "—")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, " ");
}

// Recursively flatten inline tokens to plain text
function inlineText(tokens: any[]): string {
  if (!tokens) return "";
  return tokens
    .map((t) => {
      switch (t.type) {
        case "text": return t.text;
        case "strong": return inlineText(t.tokens);
        case "em": return inlineText(t.tokens);
        case "codespan": return t.text;
        case "del": return inlineText(t.tokens);
        case "link": return inlineText(t.tokens);
        case "br": return "\n";
        case "html": return t.text.replace(/<[^>]+>/g, "");
        default: return t.raw || "";
      }
    })
    .join("");
}

const NAVY: [number, number, number] = [26, 54, 93];
const NAVY_DARK: [number, number, number] = [16, 32, 60];
const GOLD: [number, number, number] = [180, 142, 45];
const TEXT: [number, number, number] = [40, 40, 50];
const SUBTLE: [number, number, number] = [110, 110, 120];
const RED_BG: [number, number, number] = [253, 240, 240];
const RED_BORDER: [number, number, number] = [200, 70, 70];
const QUOTE_BG: [number, number, number] = [252, 248, 230];

function buildPdf(markdown: string, titoloPratica?: string): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 22;
  const marginTop = 28;
  const marginBottom = 22;
  const contentW = pageW - marginX * 2;
  let y = marginTop;

  const ensure = (h: number) => {
    if (y + h > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  const writeText = (
    text: string,
    opts: { size?: number; style?: "normal" | "bold" | "italic"; color?: [number, number, number]; lineH?: number; indent?: number } = {},
  ) => {
    const { size = 11, style = "normal", color = TEXT, lineH = 5.6, indent = 0 } = opts;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(clean(text), contentW - indent);
    for (const line of lines) {
      ensure(lineH);
      doc.text(line, marginX + indent, y);
      y += lineH;
    }
  };

  // === COVER ===
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 60, pageW, 1.2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("IUSTA", marginX, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(220, 215, 200);
  doc.text("Report di Analisi Tecnico-Giuridica", marginX, 40);
  doc.setFontSize(9);
  doc.text("Infortunistica Stradale — Documento riservato", marginX, 48);

  y = 80;
  if (titoloPratica) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    const ttlLines = doc.splitTextToSize(clean(titoloPratica), contentW);
    for (const l of ttlLines) {
      doc.text(l, marginX, y);
      y += 9;
    }
    y += 2;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(SUBTLE[0], SUBTLE[1], SUBTLE[2]);
  doc.text(`Data di emissione: ${new Date().toLocaleDateString("it-IT")}`, marginX, y);
  y += 12;
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + 40, y);
  y += 10;

  // === PARSE MARKDOWN ===
  const tokens: any[] = marked.lexer(markdown);

  const renderInline = (tokens: any[]): { text: string; bold: boolean }[] => {
    const segs: { text: string; bold: boolean }[] = [];
    const walk = (toks: any[], boldCtx = false) => {
      for (const t of toks || []) {
        if (t.type === "strong") walk(t.tokens, true);
        else if (t.type === "em") walk(t.tokens, boldCtx);
        else if (t.type === "text") segs.push({ text: t.text, bold: boldCtx });
        else if (t.type === "codespan") segs.push({ text: t.text, bold: boldCtx });
        else if (t.type === "link") walk(t.tokens, boldCtx);
        else if (t.type === "br") segs.push({ text: "\n", bold: boldCtx });
        else if (t.type === "html") segs.push({ text: t.text.replace(/<[^>]+>/g, ""), bold: boldCtx });
        else if (t.tokens) walk(t.tokens, boldCtx);
        else if (t.raw) segs.push({ text: t.raw, bold: boldCtx });
      }
    };
    walk(tokens);
    return segs;
  };

  const writeRichLine = (segs: { text: string; bold: boolean }[], opts: { size?: number; color?: [number, number, number]; indent?: number; lineH?: number } = {}) => {
    const { size = 11, color = TEXT, indent = 0, lineH = 5.8 } = opts;
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    // Build words with bold flag, then layout
    const words: { w: string; bold: boolean }[] = [];
    for (const s of segs) {
      const text = clean(s.text);
      const parts = text.split(/(\s+)/);
      for (const p of parts) if (p) words.push({ w: p, bold: s.bold });
    }
    let cursor = marginX + indent;
    let lineHasContent = false;
    const flushLine = () => {
      y += lineH;
      cursor = marginX + indent;
      lineHasContent = false;
    };
    ensure(lineH);
    for (const tok of words) {
      if (tok.w === "\n") { if (lineHasContent) flushLine(); else { y += lineH * 0.5; } continue; }
      doc.setFont("helvetica", tok.bold ? "bold" : "normal");
      const ww = doc.getTextWidth(tok.w);
      if (cursor + ww > pageW - marginX) {
        flushLine();
        ensure(lineH);
        if (/^\s+$/.test(tok.w)) continue;
      }
      doc.text(tok.w, cursor, y);
      cursor += ww;
      lineHasContent = true;
    }
    if (lineHasContent) y += lineH;
    y += 1.5;
  };

  for (const tok of tokens) {
    if (tok.type === "heading") {
      const text = inlineText(tok.tokens);
      if (tok.depth === 1) {
        ensure(16);
        y += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        const lines = doc.splitTextToSize(clean(text), contentW);
        for (const l of lines) { ensure(8); doc.text(l, marginX, y); y += 7.5; }
        doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.setLineWidth(0.6);
        doc.line(marginX, y, marginX + 30, y);
        y += 6;
      } else if (tok.depth === 2) {
        ensure(13);
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        const lines = doc.splitTextToSize(clean(text), contentW);
        for (const l of lines) { ensure(7); doc.text(l, marginX, y); y += 6.5; }
        y += 2;
      } else {
        ensure(10);
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(NAVY_DARK[0], NAVY_DARK[1], NAVY_DARK[2]);
        const lines = doc.splitTextToSize(clean(text), contentW);
        for (const l of lines) { ensure(6); doc.text(l, marginX, y); y += 5.5; }
        y += 1.5;
      }
    } else if (tok.type === "paragraph") {
      const segs = renderInline(tok.tokens);
      const fullText = segs.map((s) => s.text).join("");
      const isContradiction = /BUGIA TECNICA|SMENTITA|INCONGRUENZA|CONTRADDIZ/i.test(fullText);
      if (isContradiction) {
        // colored callout
        const lines = doc.splitTextToSize(clean(fullText), contentW - 8);
        const blockH = lines.length * 5.6 + 6;
        ensure(blockH);
        doc.setFillColor(RED_BG[0], RED_BG[1], RED_BG[2]);
        doc.rect(marginX, y - 4, contentW, blockH, "F");
        doc.setDrawColor(RED_BORDER[0], RED_BORDER[1], RED_BORDER[2]);
        doc.setLineWidth(1.2);
        doc.line(marginX, y - 4, marginX, y - 4 + blockH);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(120, 30, 30);
        for (const l of lines) { doc.text(l, marginX + 4, y); y += 5.6; }
        y += 4;
      } else {
        writeRichLine(segs);
      }
    } else if (tok.type === "list") {
      for (const item of tok.items) {
        const segs = renderInline(item.tokens?.[0]?.tokens || item.tokens || []);
        ensure(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text(tok.ordered ? `${(item as any).raw?.match(/^\d+/)?.[0] || "•"}.` : "•", marginX + 1, y);
        writeRichLine(segs, { indent: 7 });
      }
      y += 1;
    } else if (tok.type === "blockquote") {
      const segs = renderInline(tok.tokens?.flatMap?.((t: any) => t.tokens || []) || []);
      const fullText = segs.map((s) => s.text).join("");
      const lines = doc.splitTextToSize(clean(fullText), contentW - 10);
      const blockH = lines.length * 5.6 + 6;
      ensure(blockH);
      doc.setFillColor(QUOTE_BG[0], QUOTE_BG[1], QUOTE_BG[2]);
      doc.rect(marginX, y - 4, contentW, blockH, "F");
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.setLineWidth(1.4);
      doc.line(marginX, y - 4, marginX, y - 4 + blockH);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(80, 70, 50);
      for (const l of lines) { doc.text(l, marginX + 5, y); y += 5.6; }
      y += 4;
    } else if (tok.type === "table") {
      const head = [tok.header.map((h: any) => clean(inlineText(h.tokens || [{ text: h.text }])))];
      const body = tok.rows.map((row: any[]) => row.map((c: any) => clean(inlineText(c.tokens || [{ text: c.text }]))));
      ensure(15);
      autoTable(doc, {
        head,
        body,
        startY: y,
        margin: { left: marginX, right: marginX },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9.5, cellPadding: 3, textColor: TEXT, lineColor: [220, 215, 200], lineWidth: 0.2 },
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 246, 240] },
      });
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 5;
    } else if (tok.type === "hr") {
      ensure(6);
      doc.setDrawColor(220, 215, 200);
      doc.setLineWidth(0.2);
      doc.line(marginX, y, pageW - marginX, y);
      y += 5;
    } else if (tok.type === "space") {
      y += 2;
    } else if (tok.type === "html") {
      // best effort: strip tags and render as paragraph
      const txt = (tok.text || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
      if (txt.trim()) writeText(txt);
    } else if (tok.type === "code") {
      ensure(8);
      doc.setFillColor(245, 244, 240);
      const lines = (tok.text || "").split("\n");
      const blockH = lines.length * 4.8 + 4;
      ensure(blockH);
      doc.rect(marginX, y - 3, contentW, blockH, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 70);
      for (const l of lines) { doc.text(clean(l), marginX + 3, y); y += 4.8; }
      y += 3;
    }
  }

  // Headers / footers on every page
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text("IUSTA", marginX, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(SUBTLE[0], SUBTLE[1], SUBTLE[2]);
      doc.text("Report di Analisi Tecnico-Giuridica", pageW - marginX, 14, { align: "right" });
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.setLineWidth(0.3);
      doc.line(marginX, 17, pageW - marginX, 17);
    }
    doc.setFontSize(8);
    doc.setTextColor(SUBTLE[0], SUBTLE[1], SUBTLE[2]);
    doc.text(`Pagina ${i} di ${total}`, pageW / 2, pageH - 10, { align: "center" });
    doc.text(`Generato il ${new Date().toLocaleString("it-IT")}`, marginX, pageH - 10);
    doc.text("Documento Riservato", pageW - marginX, pageH - 10, { align: "right" });
  }

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

    if (format === "html-public-url") {
      // legacy path retained: upload simple HTML for Google Docs preview
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titoloPratica || "IUSTA"}</title><style>
body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a;max-width:780px;margin:2em auto;padding:0 1em}
h1{color:#1a365d;border-bottom:2px solid #1a365d;padding-bottom:6px;font-size:20pt}
h2{color:#1a365d;margin-top:1.5em;font-size:15pt}h3{color:#2d4a7a;font-size:13pt}
table{border-collapse:collapse;width:100%;margin:1em 0}td,th{border:1px solid #ccc;padding:6px 10px}th{background:#f0f4fa}
</style></head><body>${(marked.parse(markdown) as string)}</body></html>`;
      const fname = `report_${crypto.randomUUID()}.html`;
      await supabase.storage.from("reports").upload(fname, new Blob([html], { type: "text/html; charset=utf-8" }), { contentType: "text/html; charset=utf-8", upsert: true });
      const { data: pub } = supabase.storage.from("reports").getPublicUrl(fname);
      return new Response(JSON.stringify({ url: pub.publicUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
