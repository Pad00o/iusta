import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCase, type Case } from "@/lib/case-storage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Confronta() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = (params.get("ids") || "").split(",").filter(Boolean);
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    Promise.all(ids.map(getCase)).then((arr) => setCases(arr.filter(Boolean) as Case[]));
  }, [params]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="border-b border-border px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/storico")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Storico
        </Button>
        <h1 className="text-lg font-bold">Confronto casi ({cases.length})</h1>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {cases.map((c) => {
          const report = c.messages.find((m) => m.role === "assistant")?.content || "_(nessun report)_";
          return (
            <ScrollArea key={c.id} className="border-r border-border h-full">
              <div className="p-6">
                <div className="mb-4 pb-3 border-b border-border">
                  <h2 className="font-bold">{c.titoloPratica || c.title}</h2>
                  <p className="text-xs text-muted-foreground">{c.numeroPratica && `N° ${c.numeroPratica} • `}{new Date(c.createdAt).toLocaleDateString("it-IT")}</p>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          );
        })}
      </div>
    </div>
  );
}
