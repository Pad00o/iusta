// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { marked } from "https://esm.sh/marked@12.0.2";
// @ts-ignore
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
  Header, Footer, PageNumber, LevelFormat,
} from "https://esm.sh/docx@8.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function clean(s: string): string {
  if (!s) return "";
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/gu, "")
    .replace(/\u00a0/g, " ");
}

function inlineRuns(tokens: any[], opts: { bold?: boolean; italic?: boolean } = {}): TextRun[] {
  const out: TextRun[] = [];
  for (const t of tokens || []) {
    if (t.type === "strong") out.push(...inlineRuns(t.tokens, { ...opts, bold: true }));
    else if (t.type === "em") out.push(...inlineRuns(t.tokens, { ...opts, italic: true }));
    else if (t.type === "del") out.push(...inlineRuns(t.tokens, opts));
    else if (t.type === "link") out.push(...inlineRuns(t.tokens, opts));
    else if (t.type === "codespan") out.push(new TextRun({ text: clean(t.text), font: "Consolas", bold: opts.bold, italics: opts.italic }));
    else if (t.type === "br") out.push(new TextRun({ text: "", break: 1 }));
    else if (t.type === "text") out.push(new TextRun({ text: clean(t.text), bold: opts.bold, italics: opts.italic }));
    else if (t.type === "html") {
      const txt = (t.text || "").replace(/<[^>]+>/g, "");
      if (txt) out.push(new TextRun({ text: clean(txt), bold: opts.bold, italics: opts.italic }));
    } else if (t.tokens) out.push(...inlineRuns(t.tokens, opts));
    else if (t.raw) out.push(new TextRun({ text: clean(t.raw), bold: opts.bold, italics: opts.italic }));
  }
  return out;
}

function inlineText(tokens: any[]): string {
  if (!tokens) return "";
  return clean(tokens.map((t) => t.tokens ? inlineText(t.tokens) : (t.text || t.raw || "")).join(""));
}

const NAVY = "1A365D";
const NAVY_DARK = "10203C";
const GOLD = "B48E2D";
const TEXT = "1F2430";
const SUBTLE = "6B6F7A";
const RED_BG = "FBEAEA";
const QUOTE_BG = "FCF8E6";

function buildChildren(markdown: string): any[] {
  const tokens: any[] = marked.lexer(markdown);
  const out: any[] = [];

  for (const tok of tokens) {
    if (tok.type === "heading") {
      const text = inlineText(tok.tokens);
      if (tok.depth === 1) {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 320, after: 160 },
          border: { bottom: { color: GOLD, style: BorderStyle.SINGLE, size: 8, space: 4 } },
          children: [new TextRun({ text: clean(text), bold: true, size: 36, color: NAVY, font: "Cambria" })],
        }));
      } else if (tok.depth === 2) {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          children: [new TextRun({ text: clean(text), bold: true, size: 28, color: NAVY, font: "Cambria" })],
        }));
      } else {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: clean(text), bold: true, size: 24, color: NAVY_DARK, font: "Cambria" })],
        }));
      }
    } else if (tok.type === "paragraph") {
      const runs = inlineRuns(tok.tokens);
      const fullText = inlineText(tok.tokens);
      const isContradiction = /BUGIA TECNICA|SMENTITA|INCONGRUENZA|CONTRADDIZ/i.test(fullText);
      out.push(new Paragraph({
        spacing: { before: 80, after: 120, line: 320 },
        shading: isContradiction ? { type: ShadingType.CLEAR, color: "auto", fill: RED_BG } : undefined,
        border: isContradiction ? { left: { color: "C84646", style: BorderStyle.SINGLE, size: 18, space: 8 } } : undefined,
        children: runs.length ? runs : [new TextRun({ text: clean(fullText) })],
      }));
    } else if (tok.type === "list") {
      for (const item of tok.items) {
        const itemTokens = item.tokens?.[0]?.type === "text" ? (item.tokens[0].tokens || [{ type: "text", text: item.text }]) : (item.tokens || []);
        const runs = inlineRuns(itemTokens);
        out.push(new Paragraph({
          numbering: tok.ordered
            ? { reference: "iusta-numbers", level: 0 }
            : { reference: "iusta-bullets", level: 0 },
          spacing: { before: 40, after: 40, line: 300 },
          children: runs.length ? runs : [new TextRun({ text: clean(item.text || "") })],
        }));
      }
    } else if (tok.type === "blockquote") {
      const inner = (tok.tokens || []).flatMap((t: any) => t.tokens || []);
      const runs = inlineRuns(inner);
      const text = inlineText(inner);
      out.push(new Paragraph({
        spacing: { before: 120, after: 120, line: 320 },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: QUOTE_BG },
        border: { left: { color: GOLD, style: BorderStyle.SINGLE, size: 24, space: 8 } },
        children: runs.length ? runs.map((r: any) => { (r as any).options.italics = true; return r; }) : [new TextRun({ text: clean(text), italics: true })],
      }));
    } else if (tok.type === "table") {
      const headerRow = new TableRow({
        tableHeader: true,
        children: tok.header.map((h: any) =>
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: NAVY },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: clean(inlineText(h.tokens || [{ text: h.text }])), bold: true, color: "FFFFFF", size: 20 })] })],
          })
        ),
      });
      const bodyRows = tok.rows.map((row: any[], idx: number) =>
        new TableRow({
          children: row.map((c: any) =>
            new TableCell({
              shading: idx % 2 ? { type: ShadingType.CLEAR, color: "auto", fill: "F6F4ED" } : undefined,
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ children: inlineRuns(c.tokens || [{ type: "text", text: c.text || "" }]) })],
            })
          ),
        })
      );
      out.push(new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [headerRow, ...bodyRows],
      }));
      out.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "" })] }));
    } else if (tok.type === "hr") {
      out.push(new Paragraph({
        spacing: { before: 100, after: 100 },
        border: { bottom: { color: "C8C3B0", style: BorderStyle.SINGLE, size: 6, space: 1 } },
        children: [new TextRun({ text: "" })],
      }));
    } else if (tok.type === "space") {
      // skip
    } else if (tok.type === "html") {
      const txt = (tok.text || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
      if (txt.trim()) {
        out.push(new Paragraph({ spacing: { line: 320 }, children: [new TextRun({ text: clean(txt) })] }));
      }
    } else if (tok.type === "code") {
      out.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "F4F2EC" },
        spacing: { before: 80, after: 80 },
        children: (tok.text || "").split("\n").map((l: string, i: number, arr: string[]) =>
          new TextRun({ text: clean(l), font: "Consolas", size: 18, break: i < arr.length - 1 ? 1 : 0 })
        ),
      }));
    }
  }

  return out;
}

async function buildDocx(markdown: string, titoloPratica?: string): Promise<Uint8Array> {
  const dateStr = new Date().toLocaleDateString("it-IT");

  const cover: any[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 600, after: 80 },
      children: [new TextRun({ text: "IUSTA", bold: true, size: 56, color: NAVY, font: "Cambria" })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { color: GOLD, style: BorderStyle.SINGLE, size: 12, space: 6 } },
      children: [new TextRun({ text: "Report di Analisi Tecnico-Giuridica", size: 24, color: SUBTLE })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: clean(titoloPratica || "Pratica"), bold: true, size: 36, color: NAVY, font: "Cambria" })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: `Data di emissione: ${dateStr}`, size: 22, color: SUBTLE })],
    }),
    new Paragraph({
      spacing: { after: 600 },
      children: [new TextRun({ text: "Documento riservato — Infortunistica Stradale", size: 18, italics: true, color: SUBTLE })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const body = buildChildren(markdown);

  const doc = new Document({
    creator: "IUSTA",
    title: titoloPratica || "IUSTA Report",
    description: "Report di Analisi Tecnico-Giuridica",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Cambria", color: NAVY },
          paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Cambria", color: NAVY },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Cambria", color: NAVY_DARK },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [
        { reference: "iusta-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "iusta-numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            border: { bottom: { color: GOLD, style: BorderStyle.SINGLE, size: 6, space: 4 } },
            children: [
              new TextRun({ text: "IUSTA", bold: true, size: 18, color: NAVY }),
              new TextRun({ text: "   |   Report di Analisi Tecnico-Giuridica", size: 16, color: SUBTLE }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Pagina ", size: 16, color: SUBTLE }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: SUBTLE }),
              new TextRun({ text: " di ", size: 16, color: SUBTLE }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: SUBTLE }),
              new TextRun({ text: "   —   Documento Riservato", size: 16, color: SUBTLE }),
            ],
          })],
        }),
      },
      children: [...cover, ...body],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { markdown, titoloPratica } = await req.json();
    if (!markdown) {
      return new Response(JSON.stringify({ error: "No markdown provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bytes = await buildDocx(markdown, titoloPratica);
    const fileName = (titoloPratica || "IUSTA_Report").replace(/[^a-zA-Z0-9]/g, "_") + ".docx";
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("generate-docx error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
