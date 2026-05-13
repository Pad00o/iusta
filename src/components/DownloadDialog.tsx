import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileType, ExternalLink, Loader2, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DownloadDialogProps {
  onExportPdf: () => void;
  onExportDocx: () => void;
  markdown: string;
  titoloPratica?: string;
  caseId?: string | null;
}

export function DownloadDialog({ onExportPdf, onExportDocx, markdown, titoloPratica, caseId }: DownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loadingGdocs, setLoadingGdocs] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);

  const handleGoogleDocs = async () => {
    setLoadingGdocs(true);
    try {
      // Generate a real .docx, upload to public bucket, then open Google Docs viewer
      const docxResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown, titoloPratica }),
        }
      );
      if (!docxResp.ok) throw new Error("docx fail");
      const blob = await docxResp.blob();
      const fname = `report_${crypto.randomUUID()}.docx`;
      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(fname, blob, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("reports").getPublicUrl(fname);
      // Google Docs viewer renders Word docs natively (with full formatting)
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
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fascicolo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown, titoloPratica, caseId }),
        }
      );
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(titoloPratica || "IUSTA").replace(/[^a-zA-Z0-9]/g, "_")}_Fascicolo_Pro.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Fascicolo Pro generato", description: "Pacchetto ZIP scaricato." });
      setOpen(false);
    } catch {
      toast({ title: "Errore generazione Fascicolo Pro", variant: "destructive" });
    } finally {
      setLoadingZip(false);
    }
  };

  const options = [
    {
      icon: Package,
      label: "Fascicolo Pro (.zip)",
      description: "PDF + Word + Documenti originali in un unico pacchetto",
      action: handleFascicoloPro,
      color: "text-primary",
      bg: "bg-primary/15 border border-primary/30",
      loading: loadingZip,
      featured: true,
    },
    {
      icon: FileText,
      label: "PDF",
      description: "Documento PDF formattato pronto per la stampa",
      action: () => { onExportPdf(); setOpen(false); },
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: FileType,
      label: "Word (.docx)",
      description: "Documento Word professionale apribile in Word/Pages",
      action: () => { onExportDocx(); setOpen(false); },
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: loadingGdocs ? Loader2 : ExternalLink,
      label: "Apri in Google Documenti",
      description: "Visualizza il report direttamente in Google Docs",
      action: handleGoogleDocs,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
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
      <DialogContent className="sm:max-w-md glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Download className="h-5 w-5 text-primary" />
            Esporta Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              disabled={opt.loading}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group disabled:opacity-60 ${
                opt.featured
                  ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:shadow-gold-glow"
                  : "border-border/10 hover:bg-accent/30"
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
