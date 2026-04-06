import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { Send, Download, FileDown, Scale } from "lucide-react";
import type { Message } from "@/lib/chat-stream";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportViewProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  titoloPratica: string;
  numeroPratica: string;
  onSendFollowUp: (text: string) => void;
  onExportPdf: () => void;
}

const sectionAnchors = [
  { id: "scheda-sinistro", label: "Scheda Sinistro", emoji: "📋" },
  { id: "cronistoria", label: "Cronistoria", emoji: "🕒" },
  { id: "analisi-critica", label: "Analisi Tecnica", emoji: "⚠️" },
  { id: "violazioni", label: "Violazioni CdS", emoji: "⚖️" },
  { id: "svolgimento", label: "Svolgimento Fatto", emoji: "📝" },
];

export function ReportView({
  messages,
  isLoading,
  isStreaming,
  titoloPratica,
  numeroPratica,
  onSendFollowUp,
  onExportPdf,
}: ReportViewProps) {
  const [followUpInput, setFollowUpInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = followUpInput.trim();
    if (!trimmed || isLoading) return;
    onSendFollowUp(trimmed);
    setFollowUpInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find the first assistant message (the main report)
  const reportMessage = messages.find((m) => m.role === "assistant");
  const followUpMessages = messages.slice(reportMessage ? messages.indexOf(reportMessage) + 1 : messages.length);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left index */}
      <div className="hidden lg:flex w-56 flex-shrink-0 border-r border-border bg-card flex-col p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Indice Report
        </h3>
        <nav className="space-y-1">
          {sectionAnchors.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full text-left px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main report content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Report header */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {titoloPratica || "Report Analisi"}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {numeroPratica && <span>Pratica: {numeroPratica}</span>}
              <span>{new Date().toLocaleDateString("it-IT")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportPdf}>
              <Download className="h-4 w-4 mr-1" />
              Scarica PDF
            </Button>
          </div>
        </div>

        {/* Report body */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {/* Main report */}
            {reportMessage && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({ children, ...props }) => {
                      const text = String(children);
                      let id = "";
                      if (text.includes("SCHEDA")) id = "scheda-sinistro";
                      else if (text.includes("CRONISTORIA")) id = "cronistoria";
                      else if (text.includes("ANALISI") || text.includes("CONTRADDIZIONI")) id = "analisi-critica";
                      else if (text.includes("VIOLAZIONI")) id = "violazioni";
                      else if (text.includes("SVOLGIMENTO")) id = "svolgimento";
                      return (
                        <h3 id={id} className="scroll-mt-4" {...props}>
                          {children}
                        </h3>
                      );
                    },
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full" {...props}>{children}</table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="bg-muted px-3 py-2 text-left text-xs font-semibold" {...props}>{children}</th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="px-3 py-2 text-sm border-t border-border" {...props}>{children}</td>
                    ),
                  }}
                >
                  {reportMessage.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Streaming indicator */}
            {isLoading && !reportMessage && (
              <div className="flex gap-3 items-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
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

            {/* Follow-up messages */}
            {followUpMessages.length > 0 && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Conversazione di follow-up</h3>
                {followUpMessages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    message={msg}
                    isStreaming={isStreaming && i === followUpMessages.length - 1 && msg.role === "assistant"}
                  />
                ))}
              </div>
            )}

            {isLoading && followUpMessages.length > 0 && followUpMessages[followUpMessages.length - 1]?.role === "user" && (
              <div className="flex gap-3 items-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
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

        {/* Follow-up chat input */}
        <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Chiedi ulteriori approfondimenti sull'analisi..."
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !followUpInput.trim()} className="h-auto">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
