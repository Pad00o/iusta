import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { RotateCcw, Scale, Play, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadZone } from "@/components/FileUploadZone";
import { AnalysisStepper } from "@/components/AnalysisStepper";
import { AnalysisSettings } from "@/components/AnalysisSettings";
import { CaseInfoForm } from "@/components/CaseInfoForm";
import { ReportView } from "@/components/ReportView";
import { streamChat } from "@/lib/chat-stream";
import { saveCase, getCase } from "@/lib/case-storage";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Load case from URL param
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
          setPhase("report");
        }
      });
      setSearchParams({}, { replace: true });
    }
  }, []);

  const currentStep = phase === "upload" ? 1 : phase === "processing" ? 3 : 4;

  const doSaveCase = async (msgs: typeof messages) => {
    if (msgs.length === 0) return;
    const saved = await saveCase({
      id: caseId || undefined,
      messages: msgs,
      titoloPratica: caseInfo.titoloPratica,
      numeroPratica: caseInfo.numeroPratica,
      note: caseInfo.note,
    });
    if (!caseId) setCaseId(saved.id);
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0) {
      toast({ title: "Carica almeno un documento per avviare l'analisi", variant: "destructive" });
      return;
    }

    setPhase("processing");
    setIsLoading(true);

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
      onDone: () => {
        setIsLoading(false);
        setPhase("report");
        setMessages((prev) => {
          doSaveCase(prev);
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
    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = "";

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
        setMessages((prev) => {
          doSaveCase(prev);
          return prev;
        });
      },
      onError: (err) => {
        toast({ title: err, variant: "destructive" });
        setIsLoading(false);
      },
    });
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
      a.download = `${caseInfo.titoloPratica || "report-analisi"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Errore nel download del PDF", variant: "destructive" });
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage?.role === "assistant";

  // Report phase
  if (phase === "report" || (phase === "processing" && messages.length > 0)) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between flex-shrink-0">
          <AnalysisStepper currentStep={currentStep} />
          <Button
            onClick={reset}
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
        />
      </div>
    );
  }

  // Upload phase
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
            {/* Upload zone */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Carica documenti
              </h2>
              <FileUploadZone files={files} onFilesChange={setFiles} />
            </div>

            {/* Case info */}
            <CaseInfoForm info={caseInfo} onChange={setCaseInfo} />

            {/* Start button */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={handleStartAnalysis}
                disabled={files.length === 0 || isLoading}
                className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              >
                <Play className="h-4 w-4 mr-2" />
                Avvia analisi
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Right sidebar - collapsible on mobile, always visible on lg */}
        <div
          className={`${
            settingsOpen ? "w-72" : "w-0 lg:w-72"
          } flex-shrink-0 border-l border-border bg-card overflow-hidden transition-all duration-300`}
        >
          <div className="w-72 p-4">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="text-sm font-semibold">Impostazioni</h3>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)}>
                ✕
              </Button>
            </div>
            <AnalysisSettings config={analysisConfig} onChange={setAnalysisConfig} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
