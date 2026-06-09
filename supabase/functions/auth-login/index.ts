// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { username, password } = await req.json();
    if (!username || !password) return json({ error: "Credenziali mancanti" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .ilike("username", String(username).trim())
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data || data.password_hash !== password) {
      return json({ error: "Credenziali errate" }, 401);
    }

    // Strip password_hash before returning
    const { password_hash: _ph, ...safe } = data as any;
    return json({ user: safe });
  } catch (e: any) {
    return json({ error: e?.message || "Errore" }, 500);
  }
});
