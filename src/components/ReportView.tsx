import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { Send, Download, Scale, FileText, Clock, AlertTriangle, Shield, CheckCircle, BookOpen, Search, AlertCircle, FileDown } from "lucide-react";
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
  onExportDocx?: () => void;
}

const sectionAnchors = [
  { id: "cronistoria", label: "Cronistoria Certificata", icon: Clock, color: "text-indigo-500" },
  { id: "criticita", label: "Criticità e Contraddizioni", icon: AlertTriangle, color: "text-amber-500" },
  { id: "responsabilita", label: "Valutazione Responsabilità", icon: Scale, color: "text-purple-500" },
  { id: "svolgimento", label: "Bozza Svolgimento", icon: BookOpen, color: "text-emerald-500" },
  { id: "dati-mancanti", label: "Dati Mancanti", icon: AlertCircle, color: "text-rose-500" },
];

export function ReportView({
  messages,
  isLoading,
  isStreaming,
  titoloPratica,
  numeroPratica,
  onSendFollowUp,
  onExportPdf,
  onExportDocx,
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

  const reportMessage = messages.find((m) => m.role === "assistant");
  const followUpMessages = messages.slice(reportMessage ? messages.indexOf(reportMessage) + 1 : messages.length);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left index */}
      <div className="hidden lg:flex w-60 flex-shrink-0 border-r border-border bg-card flex-col p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Scale className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Indice Report
            </h3>
            <p className="text-[10px] text-muted-foreground">Navigazione sezioni</p>
          </div>
        </div>
        <nav className="space-y-0.5">
          {sectionAnchors.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground w-full text-left px-2.5 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <s.icon className={`h-4 w-4 ${s.color} flex-shrink-0`} />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main report content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Report header */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {titoloPratica || "IUSTA Report"}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                  Report di Analisi Tecnico-Giuridica
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {numeroPratica && <span>Pratica: {numeroPratica}</span>}
                <span>{new Date().toLocaleDateString("it-IT")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExportPdf} className="gap-1.5">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {onExportDocx && (
              <Button variant="outline" size="sm" onClick={onExportDocx} className="gap-1.5">
                <FileDown className="h-4 w-4" />
                DOCX
              </Button>
            )}
          </div>
        </div>

        {/* Report body */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {reportMessage && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({ children, ...props }) => {
                      const text = String(children).toUpperCase();
                      let id = "";
                      let borderColor = "border-l-primary";
                      let Icon = FileText;
                      let iconColor = "text-primary";

                      if (text.includes("CRONISTORIA")) { id = "cronistoria"; borderColor = "border-l-indigo-500"; Icon = Clock; iconColor = "text-indigo-500"; }
                      else if (text.includes("CRITICIT") || text.includes("CONTRADDIZIONI")) { id = "criticita"; borderColor = "border-l-amber-500"; Icon = AlertTriangle; iconColor = "text-amber-500"; }
                      else if (text.includes("RESPONSABILIT") || text.includes("VALUTAZIONE")) { id = "responsabilita"; borderColor = "border-l-purple-500"; Icon = Scale; iconColor = "text-purple-500"; }
                      else if (text.includes("SVOLGIMENTO") || text.includes("BOZZA")) { id = "svolgimento"; borderColor = "border-l-emerald-500"; Icon = BookOpen; iconColor = "text-emerald-500"; }
                      else if (text.includes("MANCANTI")) { id = "dati-mancanti"; borderColor = "border-l-rose-500"; Icon = AlertCircle; iconColor = "text-rose-500"; }

                      return (
                        <div
                          id={id}
                          className={`scroll-mt-4 not-prose border-l-4 ${borderColor} bg-card rounded-r-lg px-4 py-3 mb-4 mt-6 flex items-center gap-3 shadow-sm`}
                        >
                          <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                          <h3 className="text-base font-bold text-foreground m-0" {...props}>
                            {children}
                          </h3>
                        </div>
                      );
                    },
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto rounded-lg border border-border shadow-sm my-4">
                        <table className="w-full" {...props}>{children}</table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="bg-primary/10 px-3 py-2.5 text-left text-xs font-bold text-foreground uppercase tracking-wider" {...props}>{children}</th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="px-3 py-2 text-sm border-t border-border" {...props}>{children}</td>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote className="border-l-4 border-emerald-500/50 bg-emerald-500/5 rounded-r-lg px-4 py-3 my-4 not-prose text-sm text-foreground italic" {...props}>{children}</blockquote>
                    ),
                    li: ({ children, ...props }) => {
                      const text = String(children);
                      if (text.includes("⚠️")) {
                        return (
                          <li className="list-none -ml-4 my-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20" {...props}>
                            {children}
                          </li>
                        );
                      }
                      if (text.includes("⚖️")) {
                        return (
                          <li className="list-none -ml-4 my-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20" {...props}>
                            {children}
                          </li>
                        );
                      }
                      if (text.includes("🛠️")) {
                        return (
                          <li className="list-none -ml-4 my-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20" {...props}>
                            {children}
                          </li>
                        );
                      }
                      return <li {...props}>{children}</li>;
                    },
                    strong: ({ children, ...props }) => {
                      const text = String(children);
                      if (text.includes("BUGIA TECNICA")) {
                        return <strong className="text-amber-500" {...props}>{children}</strong>;
                      }
                      if (text.includes("SMENTITA")) {
                        return <strong className="text-blue-500" {...props}>{children}</strong>;
                      }
                      if (text.includes("INCONGRUENZA")) {
                        return <strong className="text-red-500" {...props}>{children}</strong>;
                      }
                      if (text.includes("⚠") || text.includes("ATTENZIONE")) {
                        return <strong className="text-amber-500" {...props}>{children}</strong>;
                      }
                      if (text.includes("✅")) {
                        return <strong className="text-emerald-500" {...props}>{children}</strong>;
                      }
                      return <strong {...props}>{children}</strong>;
                    },
                  }}
                >
                  {reportMessage.content}
                </ReactMarkdown>
              </div>
            )}

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
