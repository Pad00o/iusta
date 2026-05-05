import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileType, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadDialogProps {
  onExportPdf: () => void;
  onExportDocx: () => void;
  markdown: string;
  titoloPratica?: string;
}

export function DownloadDialog({ onExportPdf, onExportDocx, markdown, titoloPratica }: DownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loadingGdocs, setLoadingGdocs] = useState(false);

  const handleGoogleDocs = async () => {
    setLoadingGdocs(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown, titoloPratica, format: "html-public-url" }),
        }
      );
      if (!resp.ok) throw new Error();
      const { url } = await resp.json();
      // Open Google Docs Viewer with the public URL — apre direttamente in Google Docs
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
      window.open(viewerUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Apertura in Google Documenti..." });
      setOpen(false);
    } catch {
      toast({ title: "Errore nell'apertura su Google Documenti", variant: "destructive" });
    } finally {
      setLoadingGdocs(false);
    }
  };

  const options = [
    {
      icon: FileText,
      label: "PDF",
      description: "Documento PDF formattato pronto per la stampa",
      action: () => { onExportPdf(); setOpen(false); },
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      icon: FileType,
      label: "Testo (.txt)",
      description: "File di testo semplice, leggibile ovunque",
      action: () => { onExportDocx(); setOpen(false); },
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: loadingGdocs ? Loader2 : ExternalLink,
      label: "Apri in Google Documenti",
      description: "Visualizza il report direttamente in Google Docs",
      action: handleGoogleDocs,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      loading: loadingGdocs,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md">
          <Download className="h-4 w-4" />
          Scarica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left group disabled:opacity-60"
            >
              <div className={`h-10 w-10 rounded-lg ${opt.bg} flex items-center justify-center flex-shrink-0`}>
                <opt.icon className={`h-5 w-5 ${opt.color} ${opt.loading ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{opt.label}</h4>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
