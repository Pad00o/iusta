import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export function SourceEvidence({ citation, caseId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const quote = (citation.quote || "").trim();
  const file = citation.file || "";

  const openModal = async () => {
    setOpen(true);
    if (!url && file && caseId) {
      try {
        const path = `${caseId}/${file}`;
        const { data } = await supabase.storage.from(citation.bucket || "case-files").createSignedUrl(path, 60 * 10);
        if (data?.signedUrl) {
          setUrl(citation.page ? `${data.signedUrl}#page=${citation.page}` : data.signedUrl);
        }
      } catch {
        /* ignore */
      }
    }
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
              {file && <span className="text-sm text-muted-foreground font-normal">— {file}{citation.page ? ` · pag. ${citation.page}` : ""}</span>}
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

          {url ? (
            <div className="rounded-2xl overflow-hidden border border-border bg-background h-[60vh]">
              <embed src={url} type="application/pdf" className="w-full h-full" />
            </div>
          ) : file && caseId ? (
            <p className="text-xs text-muted-foreground">Caricamento anteprima documento…</p>
          ) : null}

          {url && (
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
