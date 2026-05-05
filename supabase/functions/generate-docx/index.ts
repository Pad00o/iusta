import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function wrap(text: string, width = 100): string {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para.length <= width) {
      out.push(para);
      continue;
    }
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > width) {
        out.push(line.trimEnd());
        line = w;
      } else {
        line = line ? line + " " + w : w;
      }
    }
    if (line) out.push(line);
  }
  return out.join("\n");
}

function renderTable(rows: string[][]): string {
  if (!rows.length) return "";
  const cols = Math.max(...rows.map((r) => r.length));
  // Pad
  const padded = rows.map((r) => {
    const c = [...r];
    while (c.length < cols) c.push("");
    return c;
  });
  // Compute widths (cap at 30 to keep tables readable)
  const widths = Array.from({ length: cols }, (_, i) =>
    Math.min(30, Math.max(...padded.map((r) => (r[i] || "").length)))
  );
  const sep = "+" + widths.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const fmt = (r: string[]) =>
    "| " +
    r
      .map((c, i) => {
        const t = c.length > widths[i] ? c.slice(0, widths[i] - 1) + "…" : c;
        return t.padEnd(widths[i]);
      })
      .join(" | ") +
    " |";
  const out: string[] = [sep, fmt(padded[0]), sep];
  for (let i = 1; i < padded.length; i++) out.push(fmt(padded[i]));
  out.push(sep);
  return out.join("\n");
}

function markdownToText(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let tableBuf: string[][] = [];

  const flushTable = () => {
    if (tableBuf.length) {
      out.push("");
      out.push(renderTable(tableBuf));
      out.push("");
      tableBuf = [];
    }
  };

  const cleanInline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
      .replace(/<[^>]+>/g, ""); // strip any HTML

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");

    // Table row
    if (/^\s*\|/.test(line)) {
      const cells = line.split("|").slice(1, -1).map((c) => cleanInline(c.trim()));
      // skip separator
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      tableBuf.push(cells);
      continue;
    } else if (tableBuf.length) {
      flushTable();
    }

    if (/^# /.test(line)) {
      const t = cleanInline(line.slice(2)).toUpperCase();
      out.push("");
      out.push("═".repeat(Math.min(80, t.length + 6)));
      out.push("   " + t);
      out.push("═".repeat(Math.min(80, t.length + 6)));
      out.push("");
    } else if (/^## /.test(line)) {
      const t = cleanInline(line.slice(3));
      out.push("");
      out.push("── " + t.toUpperCase() + " " + "─".repeat(Math.max(3, 60 - t.length)));
      out.push("");
    } else if (/^### /.test(line)) {
      out.push("");
      out.push("• " + cleanInline(line.slice(4)));
      out.push("");
    } else if (/^\s*[-*]\s+/.test(line)) {
      out.push("  • " + cleanInline(line.replace(/^\s*[-*]\s+/, "")));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      out.push("  " + cleanInline(line.trim()));
    } else if (line.trim() === "---") {
      out.push("");
      out.push("─".repeat(80));
      out.push("");
    } else if (line.trim() === "") {
      out.push("");
    } else {
      out.push(wrap(cleanInline(line)));
    }
  }
  flushTable();

  // Collapse 3+ blank lines
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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

    const dateStr = new Date().toLocaleDateString("it-IT");
    const dateTimeStr = new Date().toLocaleString("it-IT");
    const body = markdownToText(markdown);

    const header = [
      "════════════════════════════════════════════════════════════════════",
      "                              ⚖  IUSTA",
      "                Report di Analisi Tecnico-Giuridica",
      "════════════════════════════════════════════════════════════════════",
      titoloPratica ? `Pratica:  ${titoloPratica}` : "",
      `Data:     ${dateStr}`,
      "",
      "─".repeat(68),
      "",
    ]
      .filter(Boolean)
      .join("\n");

    const footer = [
      "",
      "─".repeat(68),
      "Documento generato da IUSTA — Analisi Infortunistica Stradale",
      `Generato il ${dateTimeStr}`,
    ].join("\n");

    const text = header + body + footer;
    const fileName = (titoloPratica || "IUSTA_Report").replace(/[^a-zA-Z0-9]/g, "_") + ".txt";

    return new Response(text, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
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
