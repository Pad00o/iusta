import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, FileText, Quote } from "lucide-react";

export interface ContradictionData {
  title: string;
  /** the full block of markdown describing the contradiction */
  body: string;
  /** verbatim "ritaglio" excerpt found in the source documents (best-effort) */
  excerpt?: string;
  source?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: ContradictionData | null;
}

export function ContradictionModal({ open, onClose, data }: Props) {
  if (!data) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl glass-strong border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-serif text-xl">
            <div className="h-10 w-10 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <span className="text-destructive">{data.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {data.body}
          </div>

          <div className="relative rounded-2xl border border-border/15 bg-[hsl(40_30%_94%)] text-[hsl(224_30%_15%)] p-5 shadow-elegant">
            <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
              Ritaglio Documento
            </div>
            <Quote className="absolute top-3 right-3 h-5 w-5 text-primary/50" />
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                {data.source && (
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
                    {data.source}
                  </p>
                )}
                <p className="text-sm font-serif italic leading-relaxed">
                  «{data.excerpt || "Estratto non disponibile — riferimento citato nel report."}»
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
