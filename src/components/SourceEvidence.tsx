import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText, ExternalLink, Loader2, RefreshCw, AlertCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SourceCitation {
  file?: string;
  page?: number;
  quote?: string;
  bucket?: string; // default 'case-files'
}

interface Props {
  citation: SourceCitation;
  caseId?: string | null;
  className?: string;
}

type Status = "idle" | "loading" | "ready" | "error";

export function SourceEvidence({ citation, caseId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [highlight, setHighlight] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const quote = (citation.quote || "").trim();
  const file = citation.file || "";

  const loadSignedUrl = useCallback(async (retry = 0) => {
    if (!file || !caseId) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const path = `${caseId}/${file}`;
      const { data, error } = await supabase.storage
        .from(citation.bucket || "case-files")
        .createSignedUrl(path, 60 * 10);
      if (error || !data?.signedUrl) throw error || new Error("URL non disponibile");
      const finalUrl = citation.page ? `${data.signedUrl}#page=${citation.page}` : data.signedUrl;
      setUrl(finalUrl);
      setStatus("ready");
    } catch (e: any) {
      console.error("source-evidence load failed", e);
      if (retry < 1) {
        // Single auto-retry after 800ms
        setTimeout(() => loadSignedUrl(retry + 1), 800);
        return;
      }
      setStatus("error");
      toast.error("Impossibile caricare il documento", {
        description: e?.message || "Riprova più tardi o ricarica il documento.",
      });
    }
  }, [file, caseId, citation.bucket, citation.page]);

  const openModal = () => {
    setOpen(true);
    if (!url) loadSignedUrl();
  };

  const reload = () => {
    setUrl(null);
    setAttempt((a) => a + 1);
    loadSignedUrl();
  };

  const jumpToPage = () => {
    if (!url || !citation.page) return;
    // Force iframe reload at the right page anchor
    const base = url.split("#")[0];
    setUrl(`${base}#page=${citation.page}&t=${Date.now()}`);
    setHighlight(true);
    setTimeout(() => setHighlight(false), 1600);
  };

  if (!quote && !file) return null;

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={openModal}
              className={`liquid-action inline-flex items-center justify-center h-7 w-7 rounded-xl text-primary hover:text-primary ${className || ""}`}
              aria-label="Vedi fonte"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="glass-strong max-w-xs">
            {quote ? (
              <p className="text-xs italic">"{quote.slice(0, 180)}{quote.length > 180 ? "…" : ""}"</p>
            ) : (
              <p className="text-xs">{file}{citation.page ? ` — pag. ${citation.page}` : ""}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl glass-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <FileText className="h-5 w-5 text-primary" /> Fonte
              {file && (
                <span className="text-sm text-muted-foreground font-normal">
                  — {file}{citation.page ? ` · pag. ${citation.page}` : ""}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Estratto del documento originale utilizzato per questa affermazione.
            </DialogDescription>
          </DialogHeader>

          {quote && (
            <blockquote className="rounded-2xl border-l-4 border-primary bg-primary/5 p-4 text-sm italic leading-relaxed">
              "{quote}"
            </blockquote>
          )}

          {/* PDF viewer area with loading/error/ready states */}
          {file && caseId && (
            <div className="relative rounded-2xl overflow-hidden border border-border bg-background h-[60vh]">
              {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <Skeleton className="h-3 w-40" />
                  <p className="text-xs text-muted-foreground">Generazione URL sicuro…</p>
                </div>
              )}
              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-center text-muted-foreground">
                    Il documento non è disponibile o il link è scaduto.
                  </p>
                  <button
                    onClick={reload}
                    className="liquid-action inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-primary"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Ricarica documento
                  </button>
                </div>
              )}
              {status === "ready" && url && (
                <>
                  <embed
                    key={attempt}
                    src={url}
                    type="application/pdf"
                    className={`w-full h-full ${highlight ? "page-highlight" : ""}`}
                  />
                  {citation.page && (
                    <button
                      onClick={jumpToPage}
                      className="absolute top-3 right-3 liquid-action inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-primary backdrop-blur-md"
                      title={`Vai alla pagina ${citation.page}`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Vai a pag. {citation.page}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {status === "ready" && url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-action inline-flex items-center gap-2 text-sm text-primary px-3 py-2 rounded-xl w-fit"
            >
              <ExternalLink className="h-4 w-4" /> Apri documento originale
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
