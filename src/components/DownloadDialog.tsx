import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileDown, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadDialogProps {
  onExportPdf: () => void;
  onExportDocx: () => void;
  markdown: string;
  titoloPratica?: string;
}

export function DownloadDialog({ onExportPdf, onExportDocx, markdown, titoloPratica }: DownloadDialogProps) {
  const [open, setOpen] = useState(false);

  const handleGoogleDocs = async () => {
    try {
      const htmlContent = `<html><head><meta charset="utf-8"><title>${titoloPratica || "IUSTA Report"}</title></head><body>${markdown}</body></html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titoloPratica || "IUSTA_Report"}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "File scaricato! Apri Google Docs e importa il file HTML scaricato." });
    } catch {
      toast({ title: "Errore nell'export", variant: "destructive" });
    }
    setOpen(false);
  };

  const options = [
    {
      icon: FileText,
      label: "PDF",
      description: "Documento PDF pronto per la stampa",
      action: () => { onExportPdf(); setOpen(false); },
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      icon: FileDown,
      label: "DOCX",
      description: "Documento Word compatibile con Office",
      action: () => { onExportDocx(); setOpen(false); },
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: ExternalLink,
      label: "Google Documenti",
      description: "Scarica HTML da importare in Google Docs",
      action: handleGoogleDocs,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
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
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left group"
            >
              <div className={`h-10 w-10 rounded-lg ${opt.bg} flex items-center justify-center flex-shrink-0`}>
                <opt.icon className={`h-5 w-5 ${opt.color}`} />
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
