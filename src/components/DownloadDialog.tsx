import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink, Loader2, Package, Scale, Paperclip } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DownloadDialogProps {
  onExportPdf: () => void;
  /** Kept for backwards compatibility but no longer surfaced as a user action */
  onExportDocx?: () => void;
  markdown: string;
  titoloPratica?: string;
  caseId?: string | null;
  /** Number of original uploaded files (for preview) */
  attachmentsCount?: number;
}

export function DownloadDialog({ onExportPdf, markdown, titoloPratica, caseId, attachmentsCount = 0 }: DownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loadingGdocs, setLoadingGdocs] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);

  const tableOfContents = useMemo(() => {
    if (!markdown) return [];
    const items: { level: 1 | 2; title: string }[] = [];
    for (const line of markdown.split("\n")) {
      const m1 = line.match(/^#\s+(.+)/);
      const m2 = line.match(/^##\s+(.+)/);
      if (m1) items.push({ level: 1, title: m1[1].trim() });
      else if (m2) items.push({ level: 2, title: m2[1].trim() });
    }
    return items.slice(0, 12);
  }, [markdown]);

  const handleGoogleDocs = async () => {
    setLoadingGdocs(true);
    try {
      const { data: blob, error } = await supabase.functions.invoke("generate-docx", {
        body: { markdown, titoloPratica },
      });
      if (error) throw error;
      const docBlob = blob instanceof Blob ? blob : new Blob([blob as any]);
      const fname = `report_${crypto.randomUUID()}.docx`;
      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(fname, docBlob, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("reports").getPublicUrl(fname);
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pub.publicUrl)}`;
      window.open(viewerUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Apertura in Google Documenti...", description: "Da Google Docs puoi salvare in Drive con 'Apri con Google Docs'." });
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Errore nell'apertura su Google Documenti", variant: "destructive" });
    } finally {
      setLoadingGdocs(false);
    }
  };

  const handleFascicoloPro = async () => {
    setLoadingZip(true);
    try {
      const { data: blob, error } = await supabase.functions.invoke("generate-fascicolo", {
        body: { markdown, titoloPratica, caseId },
      });
      if (error) throw error;
      const zipBlob = blob instanceof Blob ? blob : new Blob([blob as any], { type: "application/zip" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(titoloPratica || "IUSTA").replace(/[^a-zA-Z0-9]/g, "_")}_Fascicolo_Pro.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Fascicolo Pro generato", description: "Pacchetto ZIP scaricato." });
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Errore generazione Fascicolo Pro", variant: "destructive" });
    } finally {
      setLoadingZip(false);
    }
  };

  const today = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });

  const options = [
    {
      icon: Package,
      label: "Fascicolo Pro (.zip)",
      description: "PDF + Documenti originali in un unico pacchetto",
      action: handleFascicoloPro,
      color: "text-primary",
      bg: "icon-glass",
      loading: loadingZip,
      featured: true,
    },
    {
      icon: FileText,
      label: "PDF",
      description: "Documento PDF formattato pronto per la stampa",
      action: () => { onExportPdf(); setOpen(false); },
      color: "text-red-400",
      bg: "icon-glass",
    },
    {
      icon: loadingGdocs ? Loader2 : ExternalLink,
      label: "Apri in Google Documenti",
      description: "Visualizza il report direttamente in Google Docs",
      action: handleGoogleDocs,
      color: "text-emerald-400",
      bg: "icon-glass",
      loading: loadingGdocs,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 gold-bg text-primary-foreground shadow-gold-glow hover:opacity-90 font-semibold">
          <Download className="h-4 w-4" />
          Scarica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Download className="h-5 w-5 text-primary" />
            Esporta Report
          </DialogTitle>
          <DialogDescription>
            Scegli il formato di esportazione del fascicolo. Il Fascicolo Pro include report e documenti originali.
          </DialogDescription>
        </DialogHeader>

        {/* Anteprima Fascicolo Pro */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {/* Cover preview */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 flex flex-col items-center justify-between min-h-[220px] shadow-elegant">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Anteprima copertina</div>
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-3 icon-glass flex items-center justify-center">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg leading-tight gold-text">
                {titoloPratica || "Fascicolo Tecnico-Legale"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Generato da IUSTA</p>
            </div>
            <div className="text-[10px] text-muted-foreground">{today}</div>
          </div>

          {/* TOC + meta */}
          <div className="md:col-span-3 rounded-2xl border border-border bg-card/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Indice del fascicolo</h4>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                {attachmentsCount} {attachmentsCount === 1 ? "allegato" : "allegati"}
              </span>
            </div>
            {tableOfContents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nessuna sezione rilevata.</p>
            ) : (
              <ol className="space-y-1.5 max-h-44 overflow-auto pr-2">
                {tableOfContents.map((it, i) => (
                  <li
                    key={i}
                    className={`text-sm flex gap-2 ${it.level === 1 ? "text-foreground font-semibold" : "text-foreground/80 pl-4"}`}
                  >
                    <span className="text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{it.title}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Download options */}
        <div className="space-y-2 pt-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              disabled={opt.loading}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group disabled:opacity-60 ${
                opt.featured
                  ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:shadow-gold-glow"
                  : "border-border hover:bg-accent/40"
              }`}
            >
              <div className={`h-11 w-11 rounded-2xl ${opt.bg} flex items-center justify-center flex-shrink-0`}>
                <opt.icon className={`h-5 w-5 ${opt.color} ${opt.loading ? "animate-spin" : ""}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${opt.featured ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                  {opt.featured && <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">Pro</span>}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
