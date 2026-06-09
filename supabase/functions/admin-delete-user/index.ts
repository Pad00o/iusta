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
    const { adminId, adminPasswordHash, userId } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: admin } = await supabase.from("app_users").select("id,is_admin,password_hash").eq("id", adminId).maybeSingle();
    if (!admin || !admin.is_admin || admin.password_hash !== adminPasswordHash) return json({ error: "Non autorizzato" }, 403);
    if (!userId || userId === adminId) return json({ error: "Operazione non valida" }, 400);

    const { error } = await supabase.from("app_users").delete().eq("id", userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Errore" }, 500);
  }
});
