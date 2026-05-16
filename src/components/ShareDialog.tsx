import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Lock, Copy, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShareDialogProps {
  caseId: string;
  trigger?: React.ReactNode;
}

const EXPIRY_OPTIONS = [
  { value: "24", label: "24 ore" },
  { value: "168", label: "7 giorni" },
  { value: "720", label: "30 giorni" },
  { value: "0", label: "Mai" },
];

export function ShareDialog({ caseId, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState("24");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const labelForExpiry = EXPIRY_OPTIONS.find((o) => o.value === expiry)?.label || "";

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-share", {
        body: {
          caseId,
          expiresInHours: expiry === "0" ? null : Number(expiry),
          password: password || null,
        },
      });
      if (error) throw error;
      const url = `${window.location.origin}/shared/${data.token}`;
      setLink(url);
      await navigator.clipboard.writeText(url);
      toast.success(
        expiry === "0"
          ? "Link di collaborazione copiato negli appunti."
          : `Link di collaborazione copiato negli appunti. Scadrà tra ${labelForExpiry}.`,
      );
    } catch (e: any) {
      toast.error("Errore nella generazione del link", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => {
    setLink(null);
    setPassword("");
    setExpiry("24");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" /> Condividi
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Share2 className="h-5 w-5 text-primary" /> Condividi Report
          </DialogTitle>
          <DialogDescription>
            Genera un link sicuro e in sola lettura per condividere il fascicolo con colleghi o clienti.
          </DialogDescription>
        </DialogHeader>

        {!link ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="expiry">Scadenza</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Password (opzionale)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Lascia vuoto per nessuna password"
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button onClick={generate} disabled={loading} className="w-full gold-bg text-primary-foreground font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Genera link sicuro
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 break-all text-sm font-mono">
              {link}
            </div>
            <Button onClick={copy} className="w-full gap-2" variant="outline">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiato!" : "Copia link"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {expiry === "0" ? "Il link non scadrà mai." : `Il link scadrà tra ${labelForExpiry}.`}
              {password && " Protetto da password."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
