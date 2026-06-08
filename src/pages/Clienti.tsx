import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Building2, Euro, User as UserIcon, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  username: string;
  studio: string;
  pagano: number;
  logo_url: string | null;
  is_admin: boolean;
  is_authorized: boolean;
  created_at: string;
}

export default function Clienti() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);

  const [form, setForm] = useState({
    studio: "",
    pagano: "",
    username: "",
    password: "",
  });

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Errore caricamento clienti", { description: error.message });
    } else {
      setClients((data || []) as Client[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async () => {
    if (!form.studio.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("app_users").insert({
      username: form.username.trim().toLowerCase(),
      password_hash: form.password,
      studio: form.studio.trim(),
      pagano: Number(form.pagano) || 0,
      is_admin: false,
      is_authorized: false,
    });
    setCreating(false);
    if (error) {
      toast.error("Errore creazione cliente", { description: error.message });
      return;
    }
    toast.success("Cliente creato", {
      description: `${form.studio} può ora accedere con username "${form.username}".`,
    });
    setOpenNew(false);
    setForm({ studio: "", pagano: "", username: "", password: "" });
    fetchClients();
  };

  const handleDelete = async (c: Client) => {
    const { error } = await supabase.from("app_users").delete().eq("id", c.id);
    if (error) {
      toast.error("Errore eliminazione", { description: error.message });
      return;
    }
    toast.success("Cliente eliminato");
    setToDelete(null);
    fetchClients();
  };

  const toggleAuth = async (c: Client) => {
    const next = !c.is_authorized;
    setClients((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, is_authorized: next } : x)),
    );
    const { error } = await supabase
      .from("app_users")
      .update({ is_authorized: next })
      .eq("id", c.id);
    if (error) {
      toast.error("Errore aggiornamento", { description: error.message });
      fetchClients();
    } else {
      toast.success(
        next ? "White-label autorizzato" : "White-label disattivato",
      );
    }
  };

  const customers = clients.filter((c) => !c.is_admin);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl icon-glass flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Clienti</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">
              Gestisci gli studi legali con accesso alla piattaforma IUSTA
            </p>
          </div>
          <Button
            onClick={() => setOpenNew(true)}
            className="gap-2 gold-bg text-primary-foreground font-semibold shadow-gold-glow"
          >
            <Plus className="h-4 w-4" /> Nuovo cliente
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Caricamento...
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nessun cliente ancora. Clicca "Nuovo cliente" per crearne uno.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((c) => (
              <div
                key={c.id}
                className="glass-strong relative rounded-2xl p-5 border border-white/20 hover:border-primary/40 transition-all hover:shadow-elegant"
              >
                <button
                  onClick={() => setToDelete(c)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition"
                  title="Elimina cliente"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-3 pr-8 mb-4">
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt={c.studio}
                      className="h-11 w-11 rounded-xl object-contain bg-white/80 p-1 border border-white/30"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-xl icon-glass flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-foreground truncate">
                        {c.studio || "—"}
                      </h3>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          c.is_authorized
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.is_authorized ? "active" : "standard"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserIcon className="h-3 w-3" /> {c.username}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                  <Euro className="h-3.5 w-3.5" />
                  Pagano:{" "}
                  <span className="font-semibold text-foreground">
                    € {Number(c.pagano).toLocaleString("it-IT")}
                  </span>
                  /mese
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      White-Label
                    </span>
                  </div>
                  <Switch
                    checked={c.is_authorized}
                    onCheckedChange={() => toggleAuth(c)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New client dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-md glass-strong">
          <DialogHeader>
            <DialogTitle className="font-serif">Nuovo cliente</DialogTitle>
            <DialogDescription>
              I clienti useranno username e password per accedere alla
              piattaforma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="studio">Studio *</Label>
              <Input
                id="studio"
                value={form.studio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, studio: e.target.value }))
                }
                placeholder="Studio Legale Rossi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pagano">Pagano (€/mese)</Label>
              <Input
                id="pagano"
                type="number"
                value={form.pagano}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pagano: e.target.value }))
                }
                placeholder="299"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Nome utente *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="rossi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="gold-bg text-primary-foreground font-semibold"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Crea cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {toDelete?.studio}?</AlertDialogTitle>
            <AlertDialogDescription>
              L'utente <strong>{toDelete?.username}</strong> non potrà più
              accedere alla piattaforma. Questa azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => toDelete && handleDelete(toDelete)}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
