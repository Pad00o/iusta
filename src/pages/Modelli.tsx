import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Wand2, Copy, Download, Loader2 } from "lucide-react";
import { legalTemplates, type LegalTemplate } from "@/lib/templates";
import { getAllCases, type Case } from "@/lib/case-storage";
import { streamChat, type Message } from "@/lib/chat-stream";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Modelli = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const cases = getAllCases();

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedCaseId) {
      toast({ title: "Seleziona un template e un caso", variant: "destructive" });
      return;
    }

    const selectedCase = cases.find((c) => c.id === selectedCaseId);
    if (!selectedCase) return;

    setIsGenerating(true);
    setGeneratedDoc("");

    const caseContext = selectedCase.messages
      .map((m) => `${m.role === "user" ? "Utente" : "Agente"}: ${m.content}`)
      .join("\n\n");

    const messages: Message[] = [
      {
        role: "user",
        content: `${selectedTemplate.prompt}\n\n--- DATI DEL CASO ---\nTitolo: ${selectedCase.title}\n\n${caseContext}`,
      },
    ];

    let docSoFar = "";

    await streamChat({
      messages,
      onDelta: (chunk) => {
        docSoFar += chunk;
        setGeneratedDoc(docSoFar);
      },
      onDone: () => {
        setIsGenerating(false);
        toast({ title: "Documento generato con successo" });
      },
      onError: (err) => {
        toast({ title: err, variant: "destructive" });
        setIsGenerating(false);
      },
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedDoc);
    toast({ title: "Documento copiato negli appunti" });
  };

  const handleDownloadPdf = async () => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown: generatedDoc }),
        }
      );
      if (!resp.ok) throw new Error("Errore generazione PDF");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate?.name || "documento"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Errore nel download del PDF", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modelli</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Template di documenti legali per infortunistica stradale. Seleziona un modello e un caso per generare il documento personalizzato.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template list */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Template disponibili
              </h2>
              {legalTemplates.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === t.id
                      ? "ring-2 ring-primary border-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Generator area */}
            <div className="lg:col-span-2 space-y-4">
              {selectedTemplate ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{selectedTemplate.icon}</span>
                        {selectedTemplate.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Seleziona caso
                        </label>
                        <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Scegli un caso dallo storico..." />
                          </SelectTrigger>
                          <SelectContent>
                            {cases.length === 0 ? (
                              <SelectItem value="_none" disabled>
                                Nessun caso disponibile
                              </SelectItem>
                            ) : (
                              cases.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.title} — {new Date(c.createdAt).toLocaleDateString("it-IT")}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={!selectedCaseId || isGenerating}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Generazione in corso...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-1" />
                            Genera documento
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Generated document */}
                  {generatedDoc && (
                    <Card>
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Documento generato</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copia
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {generatedDoc}
                          </ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Seleziona un template
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scegli un modello dalla lista a sinistra per iniziare
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Modelli;
