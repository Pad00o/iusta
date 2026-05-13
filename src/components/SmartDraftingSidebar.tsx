import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Suggestion {
  title: string;
  snippet: string;
}

interface Props {
  report: string;
  enabled: boolean;
}

export function SmartDraftingSidebar({ report, enabled }: Props) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!enabled || !report || items.length) return;
    let cancel = false;
    setLoading(true);
    supabase.functions
      .invoke("draft-suggestions", { body: { report } })
      .then(({ data, error }) => {
        if (cancel) return;
        if (error) throw error;
        const sugg = (data as any)?.suggestions;
        if (Array.isArray(sugg)) setItems(sugg);
      })
      .catch((e) => console.warn("draft-suggestions failed", e))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [report, enabled, items.length]);

  if (!enabled) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden xl:flex fixed right-3 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-l-2xl items-center justify-center glass shadow-elegant hover:shadow-gold-glow text-primary"
        title="Mostra suggerimenti di scrittura"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <aside className="hidden xl:flex flex-col w-[340px] flex-shrink-0 border-l border-border/10 bg-background/40 backdrop-blur-md sticky top-0 h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-serif text-sm text-foreground">Smart Drafting</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-7 w-7">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-1">
          Suggerimenti per Atto di Citazione
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Generazione in corso...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-xs text-muted-foreground p-4">
            Nessun suggerimento disponibile.
          </div>
        )}

        {items.map((s, i) => (
          <div key={i} className="rounded-2xl glass p-4 hover:shadow-gold-glow transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-serif text-primary leading-tight">{s.title}</h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${s.title}\n\n${s.snippet}`);
                  toast({ title: "Copiato negli appunti" });
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Copia"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-foreground/75 whitespace-pre-wrap">
              {s.snippet}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
