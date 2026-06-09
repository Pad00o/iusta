// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function verifyAdmin(supabase: any, adminId: string, adminPasswordHash: string) {
  const { data } = await supabase.from("app_users").select("id,is_admin,password_hash").eq("id", adminId).maybeSingle();
  return data && data.is_admin && data.password_hash === adminPasswordHash;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { adminId, adminPasswordHash, username, password, studio, pagano, is_authorized } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!(await verifyAdmin(supabase, adminId, adminPasswordHash))) return json({ error: "Non autorizzato" }, 403);
    if (!username || !password || !studio) return json({ error: "Campi mancanti" }, 400);

    const { error } = await supabase.from("app_users").insert({
      username: String(username).trim().toLowerCase(),
      password_hash: password,
      studio: String(studio).trim(),
      pagano: Number(pagano) || 0,
      is_admin: false,
      is_authorized: !!is_authorized,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Errore" }, 500);
  }
});
