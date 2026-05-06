import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface Stat { total: number; avgMs: number; byModel: Record<string, number>; byMode: Record<string, number>; tokensIn: number; tokensOut: number; }

export default function Analytics() {
  const [stat, setStat] = useState<Stat | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("analysis_logs").select("*").order("created_at", { ascending: false }).limit(500);
      const rows = data || [];
      const total = rows.length;
      const avgMs = total ? Math.round(rows.reduce((s, r: any) => s + (r.duration_ms || 0), 0) / total) : 0;
      const byModel: Record<string, number> = {};
      const byMode: Record<string, number> = {};
      let tokensIn = 0, tokensOut = 0;
      rows.forEach((r: any) => {
        byModel[r.model || "?"] = (byModel[r.model || "?"] || 0) + 1;
        byMode[r.mode || "?"] = (byMode[r.mode || "?"] || 0) + 1;
        tokensIn += r.tokens_input || 0;
        tokensOut += r.tokens_output || 0;
      });
      setStat({ total, avgMs, byModel, byMode, tokensIn, tokensOut });
    })();
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        {!stat ? <p className="text-muted-foreground">Caricamento…</p> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Analisi totali</p><p className="text-2xl font-bold">{stat.total}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Durata media</p><p className="text-2xl font-bold">{(stat.avgMs / 1000).toFixed(1)}s</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Token input</p><p className="text-2xl font-bold">{stat.tokensIn.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Token output</p><p className="text-2xl font-bold">{stat.tokensOut.toLocaleString()}</p></Card>
            <Card className="p-4 col-span-2">
              <p className="text-sm font-semibold mb-2">Per modello</p>
              {Object.entries(stat.byModel).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1"><span>{k}</span><span className="font-mono">{v}</span></div>
              ))}
            </Card>
            <Card className="p-4 col-span-2">
              <p className="text-sm font-semibold mb-2">Per modalità</p>
              {Object.entries(stat.byMode).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1"><span>{k}</span><span className="font-mono">{v}</span></div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
