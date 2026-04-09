import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, Send, ChevronRight } from "lucide-react";
import { legalTemplates } from "@/lib/templates";
import { getAllCases, type Case } from "@/lib/case-storage";
import { streamChat } from "@/lib/chat-stream";
import { toast } from "@/hooks/use-toast";
import { useModelli } from "@/contexts/ModelliContext";
import { useSidebar } from "@/components/ui/sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Modelli() {
  const [cases, setCases] = useState<Case[]>([]);
  const { toggleSidebar, setOpenMobile, state: sidebarState } = useSidebar();

  const {
    selectedTemplate, setSelectedTemplate,
    selectedCaseId, setSelectedCaseId,
    generatedDoc, setGeneratedDoc,
    isGenerating, setIsGenerating,
    resetModelli,
  } = useModelli();

  useEffect(() => {
    getAllCases().then(setCases);
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  const collapseSidebar = () => {
    if (sidebarState === "expanded") {
      toggleSidebar();
    }
    setOpenMobile(false);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setGeneratedDoc("");

    const caseContext = selectedCase
      ? `\n\nDati del caso:\nTitolo: ${selectedCase.titoloPratica || selectedCase.title}\nNumero pratica: ${selectedCase.numeroPratica || "N/A"}\nNote: ${selectedCase.note || "Nessuna"}\n\nConversazione del caso:\n${selectedCase.messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")}`
      : "";

    const prompt = `${selectedTemplate.prompt}${caseContext}\n\nGenera il documento completo in formato markdown, pronto per essere utilizzato da uno studio legale.`;

    let soFar = "";
    await streamChat({
      messages: [{ role: "user", content: prompt }],
      onDelta: (chunk) => { soFar += chunk; setGeneratedDoc(soFar); },
      onDone: () => {
        setIsGenerating(false);
        collapseSidebar();
      },
      onError: (err) => { toast({ title: err, variant: "destructive" }); setIsGenerating(false); },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
    toast({ title: "Documento copiato negli appunti" });
  };

  if (selectedTemplate) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={resetModelli}>
            ← Modelli
          </Button>
          <span className="text-2xl">{selectedTemplate.icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{selectedTemplate.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r border-border bg-card p-4 flex-shrink-0 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Collega a un caso</label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger><SelectValue placeholder="Seleziona caso (opzionale)" /></SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.titoloPratica || c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Il documento verrà personalizzato con i dati del caso</p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {isGenerating ? "Generazione..." : "Genera documento"}
            </Button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {generatedDoc ? (
              <>
                <div className="border-b border-border px-4 py-2 flex items-center justify-end gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" /> Copia
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="max-w-3xl mx-auto px-6 py-6 prose prose-sm dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedDoc}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Clicca "Genera documento" per creare il template</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Modelli</h1>
          <p className="text-sm text-muted-foreground mt-1">Template di documenti legali per infortunistica stradale</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {legalTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
            >
              <span className="text-2xl">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
