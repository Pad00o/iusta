import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Message } from "@/lib/chat-stream";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: "Testo copiato negli appunti" });
  };

  const handleDownloadPdf = async () => {
    try {
      toast({ title: "Generazione PDF in corso..." });
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown: message.content }),
        }
      );
      if (!resp.ok) throw new Error("PDF generation failed");
      const html = await resp.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast({ title: "PDF scaricato con successo" });
    } catch {
      toast({ title: "Errore nella generazione del PDF", variant: "destructive" });
    }
  };

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isAssistant ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className={`flex-1 max-w-[85%] ${isAssistant ? "" : "flex justify-end"}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isAssistant
              ? "bg-card border border-border"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-td:text-foreground prose-th:text-foreground prose-li:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {isAssistant && !isStreaming && message.content.length > 0 && (
          <div className="flex gap-1 mt-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleCopy}>
              <Copy className="h-3 w-3 mr-1" /> Copia
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleDownloadPdf}>
              <Download className="h-3 w-3 mr-1" /> PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
