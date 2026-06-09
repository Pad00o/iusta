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
    const { userId, passwordHash, patch } = await req.json();
    if (!userId || !passwordHash || !patch) return json({ error: "Dati mancanti" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.from("app_users").select("id,password_hash").eq("id", userId).maybeSingle();
    if (!data || data.password_hash !== passwordHash) return json({ error: "Non autorizzato" }, 403);

    const allowed: any = {};
    if (typeof patch.studio === "string") allowed.studio = patch.studio;
    if (typeof patch.logo_url === "string" || patch.logo_url === null) allowed.logo_url = patch.logo_url;
    if (Object.keys(allowed).length === 0) return json({ error: "Nessuna modifica" }, 400);

    const { error } = await supabase.from("app_users").update(allowed).eq("id", userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Errore" }, 500);
  }
});
