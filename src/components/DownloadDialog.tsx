import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileText, Package, Loader2, FileType2 } from "lucide-react";
import { toast } from "sonner";
import { invokeAuthed } from "@/lib/authed-invoke";
import { triggerDownload, buildReportFilename } from "@/lib/download";
import { useAuth } from "@/contexts/AuthContext";

interface DownloadDialogProps {
  onExportPdf: () => void | Promise<void>;
  onExportDocx?: () => void;
  markdown: string;
  titoloPratica?: string;
  caseId?: string | null;
  attachmentsCount?: number;
}

export function DownloadDialog({
  onExportPdf,
  markdown,
  titoloPratica,
  caseId,
}: DownloadDialogProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  const { user } = useAuth();

  const studioName = user?.is_authorized ? user.studio || null : null;
  const studioLogo = user?.is_authorized ? user.logo_url || null : null;

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      await onExportPdf();
      toast.success("PDF generato", { description: "Download avviato." });
    } catch (e: any) {
      toast.error("Errore generazione PDF", { description: e?.message });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDocx = async () => {
    setLoadingDocx(true);
    try {
      const { data, error } = await invokeAuthed("generate-docx", {
        body: { markdown, titoloPratica, studioName, studioLogo },
      });
      if (error) throw error;
      const blob = data instanceof Blob
        ? data
        : new Blob([data as any], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
      triggerDownload(blob, buildReportFilename(titoloPratica, "docx"));
      toast.success("Word generato", { description: "Download avviato." });
    } catch (e: any) {
      console.error(e);
      toast.error("Errore generazione Word", { description: e?.message });
    } finally {
      setLoadingDocx(false);
    }
  };

  const handleZip = async () => {
    setLoadingZip(true);
    try {
      const { data, error } = await invokeAuthed("generate-fascicolo", {
        body: { markdown, titoloPratica, caseId, studioName, studioLogo },
      });
      if (error) throw error;
      const blob = data instanceof Blob
        ? data
        : new Blob([data as any], { type: "application/zip" });
      triggerDownload(blob, buildReportFilename(titoloPratica, "zip", `${studioName || "IUSTA"}_Fascicolo`));
      toast.success("Fascicolo Pro generato", { description: "Pacchetto ZIP scaricato." });
    } catch (e: any) {
      console.error(e);
      toast.error("Errore generazione Fascicolo", { description: e?.message });
    } finally {
      setLoadingZip(false);
    }
  };

  const anyLoading = loadingPdf || loadingDocx || loadingZip;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          disabled={anyLoading}
          className="gap-2 gold-bg text-primary-foreground shadow-gold-glow hover:opacity-90 font-semibold"
        >
          {anyLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Scarica
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 glass-strong p-2 rounded-2xl border border-white/20 shadow-elegant"
      >
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-2">
          Esporta Report
        </DropdownMenuLabel>

        <DropdownMenuItem
          disabled={loadingPdf}
          onSelect={(e) => { e.preventDefault(); handlePdf(); }}
          className="liquid-action rounded-xl p-3 cursor-pointer focus:bg-primary/10 gap-3"
        >
          <div className="h-9 w-9 rounded-xl icon-glass flex items-center justify-center flex-shrink-0">
            {loadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
            ) : (
              <FileText className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">PDF Professionale</div>
            <div className="text-[11px] text-muted-foreground truncate">
              Documento formattato pronto per la stampa
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={loadingDocx}
          onSelect={(e) => { e.preventDefault(); handleDocx(); }}
          className="liquid-action rounded-xl p-3 cursor-pointer focus:bg-primary/10 gap-3"
        >
          <div className="h-9 w-9 rounded-xl icon-glass flex items-center justify-center flex-shrink-0">
            {loadingDocx ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <FileType2 className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Word (.docx)</div>
            <div className="text-[11px] text-muted-foreground truncate">
              Modificabile in Microsoft Word o Google Docs
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-white/10" />

        <DropdownMenuItem
          disabled={loadingZip}
          onSelect={(e) => { e.preventDefault(); handleZip(); }}
          className="liquid-action rounded-xl p-3 cursor-pointer focus:bg-primary/10 gap-3 border border-primary/30 bg-primary/5"
        >
          <div className="h-9 w-9 rounded-xl icon-glass flex items-center justify-center flex-shrink-0">
            {loadingZip ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Package className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-primary flex items-center gap-2">
              Fascicolo (.zip)
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                Pro
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              PDF + documenti originali in un unico pacchetto
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
