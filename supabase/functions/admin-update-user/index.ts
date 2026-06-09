// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { adminId, adminPasswordHash, userId, patch } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: admin } = await supabase.from("app_users").select("id,is_admin,password_hash").eq("id", adminId).maybeSingle();
    if (!admin || !admin.is_admin || admin.password_hash !== adminPasswordHash) return json({ error: "Non autorizzato" }, 403);
    if (!userId || !patch) return json({ error: "Dati mancanti" }, 400);

    const allowed: any = {};
    if (typeof patch.studio === "string") allowed.studio = patch.studio;
    if (typeof patch.logo_url === "string" || patch.logo_url === null) allowed.logo_url = patch.logo_url;
    if (patch.pagano !== undefined) allowed.pagano = Number(patch.pagano) || 0;
    if (typeof patch.is_authorized === "boolean") allowed.is_authorized = patch.is_authorized;
    if (typeof patch.password === "string" && patch.password) allowed.password_hash = patch.password;

    if (Object.keys(allowed).length === 0) return json({ error: "Nessuna modifica" }, 400);

    const { error } = await supabase.from("app_users").update(allowed).eq("id", userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Errore" }, 500);
  }
});
