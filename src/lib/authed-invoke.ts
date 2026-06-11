import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "iusta_session_v2";

function readSessionHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const s = JSON.parse(raw);
    if (!s?.user?.id || !s?.passwordHash) return {};
    return {
      "x-iusta-user-id": s.user.id as string,
      "x-iusta-password-hash": s.passwordHash as string,
    };
  } catch {
    return {};
  }
}

/**
 * Invoke a Supabase Edge Function with the IUSTA session headers attached so
 * the function's verifyCaller check passes.
 */
export function invokeAuthed<T = any>(
  name: string,
  opts: Parameters<typeof supabase.functions.invoke>[1] = {},
) {
  const headers = { ...(opts?.headers || {}), ...readSessionHeaders() };
  return supabase.functions.invoke<T>(name, { ...opts, headers });
}
