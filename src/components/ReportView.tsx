import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { DownloadDialog } from "@/components/DownloadDialog";
import { Send, Scale, FileText, Clock, AlertTriangle, Shield, CheckCircle, BookOpen, Search, AlertCircle, Settings2, BarChart3, Eye, RefreshCw } from "lucide-react";
import type { Message } from "@/lib/chat-stream";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalysisChecklist } from "@/components/AnalysisChecklist";
import { QuickFollowupButtons } from "@/components/QuickFollowupButtons";
import { VersionHistory } from "@/components/VersionHistory";
import { ContradictionModal, type ContradictionData } from "@/components/ContradictionModal";
import { SmartDraftingSidebar } from "@/components/SmartDraftingSidebar";

interface ReportViewProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  titoloPratica: string;
  numeroPratica: string;
  onSendFollowUp: (text: string) => void;
  onExportPdf: () => void;
  onExportDocx?: () => void;
  caseId?: string | null;
  onRestoreVersion?: (msgs: Message[]) => void;
  onRegenerateSection?: (sectionTitle: string) => void;
}

const sectionAnchors = [
  { id: "scheda-sinistro", label: "Scheda Sinistro", icon: FileText, color: "text-blue-600" },
  { id: "cronistoria", label: "Cronistoria dei Fatti", icon: Clock, color: "text-indigo-500" },
  { id: "analisi-tecnica", label: "Analisi Tecnica", icon: Settings2, color: "text-slate-600" },
  { id: "contraddizioni", label: "Contraddizioni", icon: AlertTriangle, color: "text-red-500" },
  { id: "violazioni", label: "Violazioni CdS", icon: Shield, color: "text-purple-500" },
  { id: "responsabilita", label: "Responsabilità", icon: BarChart3, color: "text-orange-500" },
  { id: "svolgimento", label: "Svolgimento Fatto", icon: BookOpen, color: "text-amber-700" },
  { id: "dati-mancanti", label: "Dati Mancanti", icon: AlertCircle, color: "text-red-500" },
  { id: "note-privacy", label: "Note Privacy", icon: Eye, color: "text-gray-500" },
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
  caseId,
  onRestoreVersion,
  onRegenerateSection,
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
      <div className="hidden lg:flex w-56 flex-shrink-0 border-r border-border bg-card flex-col">
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Indice</h3>
        </div>
        <nav className="px-2 space-y-0.5 flex-1">
          {sectionAnchors.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground w-full text-left px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main report content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Report header */}
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {titoloPratica || "IUSTA Report"}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                  Report di Analisi
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {numeroPratica && <span>Pratica: {numeroPratica}</span>}
                <span>Generato il: {new Date().toLocaleDateString("it-IT")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {caseId && onRestoreVersion && (
              <VersionHistory caseId={caseId} onRestore={onRestoreVersion} />
            )}
            <DownloadDialog
              onExportPdf={onExportPdf}
              onExportDocx={onExportDocx || (() => {})}
              markdown={reportMessage?.content || ""}
              titoloPratica={titoloPratica}
            />
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
                    h1: ({ children, ...props }) => {
                      const text = String(children).toUpperCase();
                      if (text.includes("IUSTA") || text.includes("REPORT")) {
                        return null; // skip main title, we have the header
                      }
                      return <h1 {...props}>{children}</h1>;
                    },
                    h2: ({ children, ...props }) => {
                      const text = String(children).toUpperCase();
                      let id = "";
                      let borderColor = "border-l-primary";
                      let Icon = FileText;
                      let iconColor = "text-primary";
                      let bgColor = "bg-card";

                      if (text.includes("SCHEDA SINISTRO")) {
                        id = "scheda-sinistro"; borderColor = "border-l-blue-600"; Icon = FileText; iconColor = "text-blue-600";
                      } else if (text.includes("CRONISTORIA")) {
                        id = "cronistoria"; borderColor = "border-l-indigo-500"; Icon = Clock; iconColor = "text-indigo-500";
                      } else if (text.includes("ANALISI TECNICA")) {
                        id = "analisi-tecnica"; borderColor = "border-l-slate-500"; Icon = Settings2; iconColor = "text-slate-600";
                      } else if (text.includes("CONTRADDIZIONI") || text.includes("PUNTI CRITICI")) {
                        id = "contraddizioni"; borderColor = "border-l-red-500"; Icon = AlertTriangle; iconColor = "text-red-500"; bgColor = "bg-red-500/5";
                      } else if (text.includes("VIOLAZIONI") || text.includes("CDS") || text.includes("CODICE")) {
                        id = "violazioni"; borderColor = "border-l-purple-500"; Icon = Shield; iconColor = "text-purple-500";
                      } else if (text.includes("RESPONSABILIT")) {
                        id = "responsabilita"; borderColor = "border-l-orange-500"; Icon = BarChart3; iconColor = "text-orange-500";
                      } else if (text.includes("SVOLGIMENTO")) {
                        id = "svolgimento"; borderColor = "border-l-amber-600"; Icon = BookOpen; iconColor = "text-amber-700";
                      } else if (text.includes("MANCANTI")) {
                        id = "dati-mancanti"; borderColor = "border-l-red-500"; Icon = AlertCircle; iconColor = "text-red-500"; bgColor = "bg-red-500/5";
                      } else if (text.includes("PRIVACY") || text.includes("NOTE PRIVACY")) {
                        id = "note-privacy"; borderColor = "border-l-gray-400"; Icon = Eye; iconColor = "text-gray-500"; bgColor = "bg-muted/50";
                      }

                      const sectionTitle = String(children);
                      return (
                        <div
                          id={id}
                          className={`scroll-mt-4 not-prose border-l-4 ${borderColor} ${bgColor} rounded-r-lg px-4 py-3 mb-4 mt-8 flex items-center gap-3 shadow-sm border border-border group`}
                        >
                          <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                          <h2 className="text-sm font-bold text-foreground m-0 uppercase tracking-wide flex-1" {...props}>
                            {children}
                          </h2>
                          {onRegenerateSection && (
                            <button
                              onClick={() => onRegenerateSection(sectionTitle)}
                              disabled={isLoading}
                              title="Rigenera questa sezione"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              <RefreshCw className="h-3 w-3" /> Rigenera
                            </button>
                          )}
                        </div>
                      );
                    },
                    h3: ({ children, ...props }) => {
                      const text = String(children).toUpperCase();
                      let id = "";
                      let borderColor = "border-l-primary";
                      let Icon = FileText;
                      let iconColor = "text-primary";
                      let bgColor = "bg-card";

                      if (text.includes("SCHEDA SINISTRO")) {
                        id = "scheda-sinistro"; borderColor = "border-l-blue-600"; Icon = FileText; iconColor = "text-blue-600";
                      } else if (text.includes("CRONISTORIA")) {
                        id = "cronistoria"; borderColor = "border-l-indigo-500"; Icon = Clock; iconColor = "text-indigo-500";
                      } else if (text.includes("ANALISI TECNICA")) {
                        id = "analisi-tecnica"; borderColor = "border-l-slate-500"; Icon = Settings2; iconColor = "text-slate-600";
                      } else if (text.includes("CONTRADDIZIONI") || text.includes("PUNTI CRITICI")) {
                        id = "contraddizioni"; borderColor = "border-l-red-500"; Icon = AlertTriangle; iconColor = "text-red-500"; bgColor = "bg-red-500/5";
                      } else if (text.includes("VIOLAZIONI") || text.includes("CDS") || text.includes("CODICE")) {
                        id = "violazioni"; borderColor = "border-l-purple-500"; Icon = Shield; iconColor = "text-purple-500";
                      } else if (text.includes("RESPONSABILIT") || text.includes("VALUTAZIONE")) {
                        id = "responsabilita"; borderColor = "border-l-orange-500"; Icon = BarChart3; iconColor = "text-orange-500";
                      } else if (text.includes("SVOLGIMENTO") || text.includes("BOZZA")) {
                        id = "svolgimento"; borderColor = "border-l-amber-600"; Icon = BookOpen; iconColor = "text-amber-700";
                      } else if (text.includes("MANCANTI")) {
                        id = "dati-mancanti"; borderColor = "border-l-red-500"; Icon = AlertCircle; iconColor = "text-red-500"; bgColor = "bg-red-500/5";
                      } else if (text.includes("PRIVACY")) {
                        id = "note-privacy"; borderColor = "border-l-gray-400"; Icon = Eye; iconColor = "text-gray-500"; bgColor = "bg-muted/50";
                      }

                      return (
                        <div
                          id={id}
                          className={`scroll-mt-4 not-prose border-l-4 ${borderColor} ${bgColor} rounded-r-lg px-4 py-3 mb-4 mt-6 flex items-center gap-3 shadow-sm border border-border`}
                        >
                          <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                          <h3 className="text-sm font-bold text-foreground m-0 uppercase tracking-wide" {...props}>
                            {children}
                          </h3>
                        </div>
                      );
                    },
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto rounded-lg border border-border shadow-sm my-4">
                        <table className="w-full text-sm" {...props}>{children}</table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="bg-muted/70 px-3 py-2.5 text-left text-xs font-bold text-foreground uppercase tracking-wider border-b border-border" {...props}>{children}</th>
                    ),
                    td: ({ children, ...props }) => {
                      const text = String(children);
                      // Badge rendering for Attendibilità / Grado certezza
                      if (text === "Alta" || text === "🟢 Alta") {
                        return <td className="px-3 py-2 text-sm border-t border-border" {...props}><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">● Alta</span></td>;
                      }
                      if (text === "Media" || text === "🟡 Media" || text === "Medio" || text === "🟡 Medio") {
                        return <td className="px-3 py-2 text-sm border-t border-border" {...props}><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">● Media</span></td>;
                      }
                      if (text === "Bassa" || text === "🔴 Bassa") {
                        return <td className="px-3 py-2 text-sm border-t border-border" {...props}><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">● Bassa</span></td>;
                      }
                      // Responsibility percentages
                      if (text.includes("100%") || text.includes("0%")) {
                        const match = text.match(/(\d+)%/);
                        if (match) {
                          const pct = parseInt(match[1]);
                          if (pct >= 80) {
                            return <td className="px-3 py-2 text-sm border-t border-border" {...props}><span className="inline-block px-3 py-1 rounded-md text-xs font-bold text-white bg-red-500">{text}</span></td>;
                          }
                          if (pct === 0) {
                            return <td className="px-3 py-2 text-sm border-t border-border" {...props}><span className="text-muted-foreground">{text}</span></td>;
                          }
                        }
                      }
                      return <td className="px-3 py-2 text-sm border-t border-border" {...props}>{children}</td>;
                    },
                    blockquote: ({ children, ...props }) => (
                      <blockquote className="not-prose rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-5 py-4 my-4 text-sm text-foreground leading-relaxed" {...props}>
                        {children}
                      </blockquote>
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
                      if (text.includes("BUGIA TECNICA")) return <strong className="text-amber-600" {...props}>{children}</strong>;
                      if (text.includes("SMENTITA")) return <strong className="text-blue-600" {...props}>{children}</strong>;
                      if (text.includes("INCONGRUENZA")) return <strong className="text-red-600" {...props}>{children}</strong>;
                      if (text.includes("Conclusione tecnica") || text.includes("CONCLUSIONE")) {
                        return (
                          <div className="not-prose my-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm">
                            <strong className="text-blue-700 dark:text-blue-400" {...props}>🔵 {children}</strong>
                          </div>
                        );
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
              <div className="py-12">
                <NeonProgressBar active={isLoading} done={false} />
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
          <div className="max-w-4xl mx-auto">
            {reportMessage && !isLoading && (
              <QuickFollowupButtons onSend={onSendFollowUp} disabled={isLoading} />
            )}
            <div className="flex gap-2">
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
    </div>
  );
}
