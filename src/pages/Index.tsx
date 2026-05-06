import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadZone } from "@/components/FileUploadZone";
import { AnalysisStepper } from "@/components/AnalysisStepper";
import { AnalysisSettings } from "@/components/AnalysisSettings";
import { CaseInfoForm } from "@/components/CaseInfoForm";
import { ReportView } from "@/components/ReportView";
import { streamChat } from "@/lib/chat-stream";
import { saveCase, getCase, uploadCaseFile, saveCaseVersion, type UploadedFileRef } from "@/lib/case-storage";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { requestNotificationPermission, notifyIfBackgrounded } from "@/hooks/useBrowserNotifications";
import { logAnalysis } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { setOpenMobile, toggleSidebar, state: sidebarState } = useSidebar();
  const online = useOnlineStatus();
  const uploadedFilesRef = useRef<UploadedFileRef[]>([]);

  const {
    messages, setMessages,
    files, setFiles,
    isLoading, setIsLoading,
    caseId, setCaseId,
    phase, setPhase,
    analysisConfig, setAnalysisConfig,
    caseInfo, setCaseInfo,
    reset,
  } = useAnalysis();

  useEffect(() => {
    const id = searchParams.get("case");
    if (id) {
      getCase(id).then((existing) => {
        if (existing) {
          setMessages(existing.messages);
          setCaseId(id);
          setCaseInfo({
            titoloPratica: existing.titoloPratica || "",
            numeroPratica: existing.numeroPratica || "",
            note: existing.note || "",
          });
          uploadedFilesRef.current = existing.uploadedFiles || [];
          setPhase("report");
        }
      });
      setSearchParams({}, { replace: true });
    }
  }, []);

  const currentStep = phase === "upload" ? 1 : phase === "processing" ? 3 : 4;

  const doSaveCase = async (msgs: typeof messages, opts?: { status?: "bozza" | "completato" | "archiviato" }) => {
    if (msgs.length === 0) return null;
    const saved = await saveCase({
      id: caseId || undefined,
      messages: msgs,
      titoloPratica: caseInfo.titoloPratica,
      numeroPratica: caseInfo.numeroPratica,
      note: caseInfo.note,
      uploadedFiles: uploadedFilesRef.current.length ? uploadedFilesRef.current : undefined,
      status: opts?.status,
    });
    if (!caseId) setCaseId(saved.id);
    return saved;
  };

  const collapseSidebar = () => {
    if (sidebarState === "expanded") toggleSidebar();
    setOpenMobile(false);
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0) {
      toast({ title: "Carica almeno un documento per avviare l'analisi", variant: "destructive" });
      return;
    }
    if (!online) {
      toast({ title: "Sei offline", description: "Connettiti a internet per avviare l'analisi", variant: "destructive" });
      return;
    }

    requestNotificationPermission();

    setPhase("processing");
    setIsLoading(true);

    // Pre-create the case so we can upload files into it
    let workingCaseId = caseId;
    if (!workingCaseId) {
      const created = await saveCase({
        messages: [],
        titoloPratica: caseInfo.titoloPratica,
        numeroPratica: caseInfo.numeroPratica,
        note: caseInfo.note,
        status: "bozza",
      });
      workingCaseId = created.id;
      setCaseId(created.id);
    }

    // Upload files to storage in background (convert base64 → File)
    const uploaded: UploadedFileRef[] = [];
    for (const f of files) {
      try {
        const bin = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
        const file = new File([bin], f.name, { type: f.type });
        const ref = await uploadCaseFile(workingCaseId!, file);
        uploaded.push(ref);
      } catch (e) { console.warn("upload failed", f.name, e); }
    }
    uploadedFilesRef.current = uploaded;

    const configText = [
      `Modalità: ${analysisConfig.mode}`,
      `Dettaglio: ${analysisConfig.detail}`,
      analysisConfig.ocrAdvanced ? "OCR avanzato attivo" : "",
      analysisConfig.anonymize ? "Anonimizzazione attiva" : "",
      caseInfo.titoloPratica ? `Titolo pratica: ${caseInfo.titoloPratica}` : "",
      caseInfo.numeroPratica ? `Numero pratica: ${caseInfo.numeroPratica}` : "",
      caseInfo.note ? `Note: ${caseInfo.note}` : "",
    ].filter(Boolean).join("\n");

    const userContent = `Analizza i seguenti documenti del sinistro.\n\n${configText}\n\n[File allegati: ${files.map((f) => f.name).join(", ")}]`;
    const userMsg = { role: "user" as const, content: userContent };
    const newMessages = [userMsg];
    setMessages(newMessages);

    let assistantSoFar = "";
    const startedAt = Date.now();

    await streamChat({
      messages: newMessages,
      files: files.length > 0 ? files : undefined,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
        if (phase !== "report") setPhase("report");
      },
      onDone: async () => {
        setIsLoading(false);
        setPhase("report");
        collapseSidebar();
        const durationMs = Date.now() - startedAt;
        notifyIfBackgrounded("IUSTA — Analisi completata", caseInfo.titoloPratica || "Il report è pronto.");
        setMessages((prev) => {
          (async () => {
            const saved = await doSaveCase(prev, { status: "completato" });
            await logAnalysis({
              caseId: saved?.id || workingCaseId,
              model: "google/gemini-2.5-pro",
              mode: analysisConfig.mode,
              durationMs,
              tokensInput: Math.round(assistantSoFar.length / 4),
              tokensOutput: Math.round(assistantSoFar.length / 4),
            });
            // fire-and-forget summary
            try {
              await supabase.functions.invoke("summarize-case", {
                body: { caseId: saved?.id || workingCaseId, report: assistantSoFar },
              });
            } catch (e) { console.warn("summarize failed", e); }
          })();
          return prev;
        });
      },
      onError: (err) => {
        toast({ title: err, variant: "destructive" });
        setIsLoading(false);
        setPhase("upload");
      },
    });
  };

  const handleFollowUp = async (text: string) => {
    if (isLoading) return;
    // snapshot before follow-up
    if (caseId) saveCaseVersion(caseId, messages, "Prima del follow-up").catch(() => {});

    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = "";
    const startedAt = Date.now();

    await streamChat({
      messages: newMessages,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        const durationMs = Date.now() - startedAt;
        notifyIfBackgrounded("IUSTA — Risposta pronta", "Follow-up completato.");
        setMessages((prev) => {
          doSaveCase(prev);
          logAnalysis({ caseId, model: "google/gemini-2.5-pro", mode: "followup", durationMs });
          return prev;
        });
      },
      onError: (err) => {
        toast({ title: err, variant: "destructive" });
        setIsLoading(false);
      },
    });
  };

  const handleRestoreVersion = (msgs: typeof messages) => {
    setMessages(msgs);
    if (caseId) doSaveCase(msgs);
    toast({ title: "Versione ripristinata" });
  };

  const handleRegenerateSection = async (sectionTitle: string) => {
    const reportMsg = messages.find((m) => m.role === "assistant");
    if (!reportMsg || isLoading) return;
    if (caseId) saveCaseVersion(caseId, messages, `Prima di rigenerare: ${sectionTitle}`).catch(() => {});
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-section", {
        body: { sectionTitle, currentReport: reportMsg.content, caseId },
      });
      if (error) throw error;
      const newSection = (data as any)?.section;
      if (!newSection) throw new Error("nessuna sezione ricevuta");
      // Replace the section in the markdown (heading match)
      const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(#{1,6}\\s*[^\\n]*${escaped}[^\\n]*\\n)([\\s\\S]*?)(?=\\n#{1,6}\\s|$)`, "i");
      const updated = reportMsg.content.match(re)
        ? reportMsg.content.replace(re, newSection + "\n\n")
        : reportMsg.content + "\n\n" + newSection;
      const newMessages = messages.map((m) => m === reportMsg ? { ...m, content: updated } : m);
      setMessages(newMessages);
      doSaveCase(newMessages);
      toast({ title: "Sezione rigenerata" });
    } catch (e: any) {
      toast({ title: "Errore rigenerazione", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    const reportMsg = messages.find((m) => m.role === "assistant");
    if (!reportMsg) return;
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown: reportMsg.content }),
        }
      );
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${caseInfo.titoloPratica || "IUSTA_Report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Errore nel download del PDF", variant: "destructive" });
    }
  };

  const handleExportDocx = async () => {
    const reportMsg = messages.find((m) => m.role === "assistant");
    if (!reportMsg) return;
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            markdown: reportMsg.content,
            titoloPratica: caseInfo.titoloPratica,
          }),
        }
      );
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${caseInfo.titoloPratica || "IUSTA_Report"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Errore nel download", variant: "destructive" });
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage?.role === "assistant";

  if (phase === "report" || (phase === "processing" && messages.length > 0)) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between flex-shrink-0">
          <AnalysisStepper currentStep={currentStep} />
          <Button
            onClick={() => { uploadedFilesRef.current = []; reset(); }}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all gap-2"
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            Nuova Analisi
          </Button>
        </div>
        <ReportView
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          titoloPratica={caseInfo.titoloPratica}
          numeroPratica={caseInfo.numeroPratica}
          onSendFollowUp={handleFollowUp}
          onExportPdf={handleExportPdf}
          onExportDocx={handleExportDocx}
          caseId={caseId}
          onRestoreVersion={handleRestoreVersion}
          onRegenerateSection={handleRegenerateSection}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between flex-shrink-0">
        <AnalysisStepper currentStep={currentStep} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="lg:hidden"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Carica documenti</h2>
              <FileUploadZone files={files} onFilesChange={setFiles} />
            </div>

            <CaseInfoForm info={caseInfo} onChange={setCaseInfo} />

            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={handleStartAnalysis}
                disabled={files.length === 0 || isLoading || !online}
                className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              >
                <Play className="h-4 w-4 mr-2" />
                {online ? "Avvia analisi" : "Offline"}
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div
          className={`${settingsOpen ? "w-72" : "w-0 lg:w-72"} flex-shrink-0 border-l border-border bg-card overflow-hidden transition-all duration-300`}
        >
          <div className="w-72 p-4">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="text-sm font-semibold">Impostazioni</h3>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)}>✕</Button>
            </div>
            <AnalysisSettings config={analysisConfig} onChange={setAnalysisConfig} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
