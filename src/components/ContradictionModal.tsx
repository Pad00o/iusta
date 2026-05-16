import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, FileText, Quote, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ContradictionData {
  title: string;
  body: string;
  excerpt?: string;
  source?: string;
  /** Document filename (e.g. "verbale_polizia.pdf") */
  documentName?: string;
  pageNumber?: number;
  lineNumber?: number;
  /** Public URL to the original document in storage */
  documentUrl?: string;
  /** Section of the report that cites this evidence */
  citedFromSection?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: ContradictionData | null;
}

export function ContradictionModal({ open, onClose, data }: Props) {
  if (!data) return null;
  const hasLocation = data.pageNumber || data.lineNumber;
  const openAtLocation = () => {
    if (!data.documentUrl) return;
    const url = data.pageNumber
      ? `${data.documentUrl}#page=${data.pageNumber}`
      : data.documentUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl glass-strong border-destructive/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-serif text-xl">
            <div className="h-10 w-10 icon-glass flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <span className="text-destructive">{data.title}</span>
          </DialogTitle>
          <DialogDescription>
            Dettaglio della contraddizione individuata, con estratto dal documento sorgente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {data.citedFromSection && (
            <p className="text-xs text-muted-foreground">
              Citato da: <span className="text-foreground font-medium">{data.citedFromSection}</span>
            </p>
          )}

          <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {data.body}
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
              Ritaglio Documento
            </div>
            <Quote className="absolute top-3 right-3 h-5 w-5 text-primary/50" />

            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">
                  {data.documentName || data.source || "Documento sorgente"}
                </span>
                {hasLocation && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold border border-primary/30">
                    <MapPin className="h-3 w-3" />
                    {data.pageNumber && `Pag. ${data.pageNumber}`}
                    {data.pageNumber && data.lineNumber && " · "}
                    {data.lineNumber && `Riga ${data.lineNumber}`}
                  </span>
                )}
              </div>
              {data.documentUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openAtLocation}
                  className="h-7 text-xs gap-1.5"
                >
                  <ExternalLink className="h-3 w-3" />
                  Apri al punto citato
                </Button>
              )}
            </div>

            <div
              className="text-sm font-serif italic leading-relaxed p-4 rounded-xl"
              style={{ background: "hsl(48 100% 88% / 0.18)", borderLeft: "3px solid hsl(43 73% 62%)" }}
            >
              «{data.excerpt || "Estratto non disponibile — riferimento citato nel report."}»
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
