import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, RotateCcw, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ChatMessage } from "@/components/ChatMessage";
import { streamChat, type Message, type FileAttachment } from "@/lib/chat-stream";
import { saveCase, getCase } from "@/lib/case-storage";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load case from URL param
  useEffect(() => {
    const id = searchParams.get("case");
    if (id) {
      const existing = getCase(id);
      if (existing) {
        setMessages(existing.messages);
        setCaseId(id);
      }
      // Clean URL
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-save after each assistant message completes
  const saveCurrentCase = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    const saved = saveCase({ id: caseId || undefined, messages: msgs });
    if (!caseId) setCaseId(saved.id);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && files.length === 0) return;
    if (isLoading) return;

    const userContent = files.length > 0
      ? `${trimmed}\n\n[File allegati: ${files.map((f) => f.name).join(", ")}]`
      : trimmed;

    const userMsg: Message = { role: "user", content: userContent };
    const currentFiles = [...files];
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setFiles([]);
    setIsLoading(true);

    let assistantSoFar = "";

    await streamChat({
      messages: newMessages,
      files: currentFiles.length > 0 ? currentFiles : undefined,
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
        // Save after stream completes
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

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setFiles([]);
    setIsLoading(false);
    setCaseId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage?.role === "assistant";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Benvenuto in LegalAgent
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                  Carica i documenti del sinistro (verbali, CID, referti, foto) e ricevi un'analisi
                  legale strutturata con cronistoria, audit tecnico e sintesi giuridica.
                </p>
                <Button variant="outline" size="sm" onClick={handleReset} className="mt-2">
                  <RotateCcw className="h-4 w-4 mr-1" /> Nuova Analisi
                </Button>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1}
              />
            ))}

            {isLoading && !isStreaming && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Scale className="h-4 w-4 text-primary-foreground animate-pulse" />
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card px-4 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <FileUploadZone files={files} onFilesChange={setFiles} />
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Nuova Analisi
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descrivi il sinistro o chiedi un'analisi dei documenti caricati..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || (!input.trim() && files.length === 0)} className="h-auto">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
