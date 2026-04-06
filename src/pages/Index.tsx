import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, RotateCcw, Scale, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadZone } from "@/components/FileUploadZone";
import { AnalysisStepper } from "@/components/AnalysisStepper";
import { AnalysisSettings, type AnalysisConfig } from "@/components/AnalysisSettings";
import { CaseInfoForm, type CaseInfo } from "@/components/CaseInfoForm";
import { ReportView } from "@/components/ReportView";
import { streamChat, type Message, type FileAttachment } from "@/lib/chat-stream";
import { saveCase, getCase } from "@/lib/case-storage";
import { toast } from "@/hooks/use-toast";

type Phase = "upload" | "processing" | "report";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("upload");

  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    mode: "completa",
    detail: "standard",
    ocrAdvanced: false,
    anonymize: true,
  });

  const [caseInfo, setCaseInfo] = useState<CaseInfo>({
    titoloPratica: "",
    numeroPratica: "",
    note: "",
  });

  // Load case from URL param
  useEffect(() => {
    const id = searchParams.get("case");
    if (id) {
      const existing = getCase(id);
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
      setSearchParams({}, { replace: true });
    }
  }, []);

  const currentStep = phase === "upload" ? 1 : phase === "processing" ? 3 : 4;

  const saveCurrentCase = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    const saved = saveCase({
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
    const userMsg: Message = { role: "user", content: userContent };
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
          saveCurrentCase(prev);
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
    const userMsg: Message = { role: "user", content: text };
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
          saveCurrentCase(prev);
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

  const handleReset = () => {
    setMessages([]);
    setFiles([]);
    setIsLoading(false);
    setCaseId(null);
    setPhase("upload");
    setCaseInfo({ titoloPratica: "", numeroPratica: "", note: "" });
  };

  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage?.role === "assistant";

  // Report phase
  if (phase === "report" || (phase === "processing" && messages.length > 0)) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between flex-shrink-0">
          <AnalysisStepper currentStep={currentStep} />
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Nuova Analisi
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
      <div className="border-b border-border bg-card px-4 py-2 flex-shrink-0">
        <AnalysisStepper currentStep={currentStep} />
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
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
                  className="px-8"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Avvia analisi
                </Button>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Tempo stimato: ~2-4 min</span>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <AnalysisSettings config={analysisConfig} onChange={setAnalysisConfig} />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Index;
