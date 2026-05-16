import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Scale, Lock, Loader2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SharedCase {
  id: string;
  title: string;
  titolo_pratica: string | null;
  numero_pratica: string | null;
  messages: Array<{ role: string; content: string }>;
  uploaded_files: any[];
  report_summary: string | null;
  created_at: string;
}

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedCase | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchData = async (pwd?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: payload, error: invErr } = await supabase.functions.invoke("get-shared-report", {
        body: { token, password: pwd },
      });
      if (invErr) {
        const status = (invErr as any)?.context?.status;
        if (status === 401) {
          const body = await (invErr as any)?.context?.json?.().catch(() => ({}));
          if (body?.passwordRequired) {
            setNeedsPassword(true);
            return;
          }
          setNeedsPassword(true);
          setError("Password errata");
          return;
        }
        throw invErr;
      }
      if (payload?.passwordRequired) {
        setNeedsPassword(true);
        return;
      }
      if (payload?.error) {
        setError(payload.error);
        return;
      }
      setData(payload.case);
      setExpiresAt(payload.expires_at);
      setNeedsPassword(false);
    } catch (e: any) {
      setError(e?.message || "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const reportMd = data?.messages?.find((m) => m.role === "assistant")?.content || "";

  const downloadPdf = async () => {
    if (!reportMd) return;
    setDownloading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ markdown: reportMd }),
        },
      );
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.titolo_pratica || "IUSTA_Report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Errore nel download del PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Branded header */}
      <header className="border-b border-border/30 glass-strong sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 icon-glass flex items-center justify-center">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg gold-text leading-none">IUSTA</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Fascicolo condiviso · sola lettura</p>
            </div>
          </div>
          {data && reportMd && (
            <Button onClick={downloadPdf} disabled={downloading} size="sm" className="gold-bg text-primary-foreground font-semibold gap-2">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Scarica PDF
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Caricamento…
          </div>
        )}

        {!loading && needsPassword && (
          <div className="glass-strong rounded-3xl p-8 max-w-md mx-auto mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl">Documento protetto</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Questo fascicolo è protetto da password. Inserisci la password fornita dal mittente.
            </p>
            <div className="space-y-3">
              <Label htmlFor="pwd">Password</Label>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData(password)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={() => fetchData(password)} className="w-full gold-bg text-primary-foreground font-semibold">
                Sblocca
              </Button>
            </div>
          </div>
        )}

        {!loading && !needsPassword && error && (
          <div className="glass-strong rounded-3xl p-8 text-center max-w-md mx-auto mt-12">
            <h2 className="font-serif text-xl mb-2">Impossibile aprire il link</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && data && (
          <article className="glass-strong rounded-3xl p-8 md:p-10">
            <header className="mb-6 pb-6 border-b border-border/40">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Fascicolo tecnico-legale</p>
              <h1 className="font-serif text-3xl gold-text">{data.titolo_pratica || data.title}</h1>
              {data.numero_pratica && (
                <p className="text-sm text-muted-foreground mt-1">Pratica n. {data.numero_pratica}</p>
              )}
              {expiresAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  Link valido fino al {new Date(expiresAt).toLocaleString("it-IT")}
                </p>
              )}
            </header>

            {reportMd ? (
              <div className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:gold-text prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportMd}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic flex items-center gap-2">
                <FileText className="h-4 w-4" /> Nessun report disponibile per questo fascicolo.
              </p>
            )}

            <footer className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Generato da IUSTA · Visualizzazione sola lettura</span>
              <span>{new Date(data.created_at).toLocaleDateString("it-IT")}</span>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
