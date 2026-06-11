import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-iusta-user-id, x-iusta-password-hash",
};

async function verifyCaller(req: Request, supa: any): Promise<boolean> {
  const userId = req.headers.get("x-iusta-user-id");
  const passwordHash = req.headers.get("x-iusta-password-hash");
  if (!userId || !passwordHash) return false;
  try {
    const { data } = await supa.from("app_users").select("id,password_hash").eq("id", userId).maybeSingle();
    return !!data && data.password_hash === passwordHash;
  } catch { return false; }
}

function mdToText(md: string): string {
  return md
    .replace(/^#{1,6}\s+(.*)$/gm, (_m, t) => `\n=== ${t.toUpperCase()} ===\n`)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!(await verifyCaller(req, supa))) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { caseIds } = await req.json();
    if (!Array.isArray(caseIds) || caseIds.length === 0 || caseIds.length > 200) throw new Error("caseIds required");
    if (!caseIds.every((x) => typeof x === "string")) throw new Error("invalid caseIds");

    const { data: cases, error } = await supa.from("cases").select("*").in("id", caseIds);
    if (error) throw error;

    const zip = new JSZip();
    for (const c of cases || []) {
      const report = (c.messages as any[])?.find((m: any) => m.role === "assistant")?.content || "(nessun report)";
      const safeName = (c.titolo_pratica || c.title || c.id).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
      const header = `IUSTA — ${c.titolo_pratica || c.title}\nPratica: ${c.numero_pratica || "-"}\nGenerato: ${new Date(c.created_at).toLocaleString("it-IT")}\n${"=".repeat(50)}\n\n`;
      zip.file(`${safeName}.txt`, header + mdToText(report));
    }
    const blob = await zip.generateAsync({ type: "uint8array" });

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="iusta_export_${Date.now()}.zip"`,
      },
    });
  } catch (e) {
    console.error("export-cases-zip error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
