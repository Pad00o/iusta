// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-iusta-user-id, x-iusta-password-hash, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyCaller(req: Request): Promise<{ ok: boolean; user?: any }> {
  const userId = req.headers.get("x-iusta-user-id");
  const passwordHash = req.headers.get("x-iusta-password-hash");
  if (!userId || !passwordHash) return { ok: false };
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("app_users")
      .select("id,username,is_admin,is_authorized,password_hash")
      .eq("id", userId)
      .maybeSingle();
    if (!data || data.password_hash !== passwordHash) return { ok: false };
    const { password_hash: _ph, ...safe } = data as any;
    return { ok: true, user: safe };
  } catch {
    return { ok: false };
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Non autorizzato" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
