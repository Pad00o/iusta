import { supabase } from "@/integrations/supabase/client";

export async function logAnalysis(params: {
  caseId?: string | null;
  model?: string;
  mode?: string;
  durationMs: number;
  tokensInput?: number;
  tokensOutput?: number;
}) {
  try {
    await supabase.from("analysis_logs").insert({
      case_id: params.caseId ?? null,
      model: params.model ?? "google/gemini-2.5-pro",
      mode: params.mode ?? null,
      duration_ms: params.durationMs,
      tokens_input: params.tokensInput ?? null,
      tokens_output: params.tokensOutput ?? null,
    });
  } catch (e) { console.warn("logAnalysis failed", e); }
}
