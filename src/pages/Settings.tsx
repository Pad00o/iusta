import { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Info,
  Palette,
  BookOpen,
  Bell,
  Building2,
  Sparkles,
  Upload,
  Loader2,
  Save,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requestNotificationPermission } from "@/hooks/useBrowserNotifications";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const [showTour, setShowTour] = useState(false);
  const { user, passwordHash, updateLocalUser, refreshUser } = useAuth();
  const [studio, setStudio] = useState(user?.studio || "");
  const [logoUrl, setLogoUrl] = useState(user?.logo_url || "");
  const [savingStudio, setSavingStudio] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStudio(user?.studio || "");
    setLogoUrl(user?.logo_url || "");
  }, [user?.id, user?.studio, user?.logo_url]);

  // Refresh once on mount, then subscribe to realtime updates on this user's row
  useEffect(() => {
    if (!user?.id) return;
    refreshUser();
    const channel = supabase
      .channel(`app_users:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_users", filter: `id=eq.${user.id}` },
        () => { refreshUser(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const canWhiteLabel = !!user?.is_authorized;

  const saveStudio = async () => {
    if (!user || !passwordHash) return;
    setSavingStudio(true);
    const { error } = await supabase.functions.invoke("self-update-user", {
      body: { userId: user.id, passwordHash, patch: { studio } },
    });
    setSavingStudio(false);
    if (error) {
      toast({ title: "Errore salvataggio", description: error.message, variant: "destructive" });
      return;
    }
    updateLocalUser({ studio });
    toast({ title: "Nome studio aggiornato" });
  };

  const handleLogoUpload = async (file: File) => {
    if (!user || !passwordHash) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logos/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("case-files")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("case-files").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: dbErr } = await supabase.functions.invoke("self-update-user", {
        body: { userId: user.id, passwordHash, patch: { logo_url: publicUrl } },
      });
      if (dbErr) throw dbErr;
      setLogoUrl(publicUrl);
      updateLocalUser({ logo_url: publicUrl });
      await refreshUser();
      toast({ title: "Logo caricato" });
    } catch (e: any) {
      toast({ title: "Errore upload", description: e?.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {showTour && <OnboardingTour forceOpen onClose={() => setShowTour(false)} />}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Impostazioni</h1>

        <div className="space-y-4">
          {/* White-label / Studio */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Studio & White-Label
                {canWhiteLabel && (
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold ml-1">
                    <Sparkles className="h-2.5 w-2.5 inline mr-0.5" /> Attivo
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Personalizza il branding dei tuoi report con nome e logo dello studio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="studio">Nome Studio</Label>
                <div className="flex gap-2">
                  <Input
                    id="studio"
                    value={studio}
                    onChange={(e) => setStudio(e.target.value)}
                    placeholder="Studio Legale Rossi & Associati"
                  />
                  <Button
                    onClick={saveStudio}
                    disabled={savingStudio || studio === user?.studio}
                    variant="outline"
                  >
                    {savingStudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {canWhiteLabel ? (
                <div className="space-y-2">
                  <Label>Logo dello studio</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Building2 className="h-7 w-7 text-muted-foreground/50" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="gap-2"
                      >
                        {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {logoUrl ? "Sostituisci logo" : "Carica logo"}
                      </Button>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Il logo apparirà sui PDF generati al posto di quello IUSTA.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                  <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground">White-label non attivo.</strong> Contatta
                    l'amministratore IUSTA per abilitare il branding personalizzato dei report.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" /> Informazioni Agente
              </CardTitle>
              <CardDescription>Dettagli sulla configurazione dell'agente IA</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versione</span>
                <span className="font-medium text-foreground">LegalAgent v1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settore</span>
                <span className="font-medium text-foreground">Infortunistica Stradale</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modello IA</span>
                <span className="font-medium text-foreground">Gemini 2.5 Pro</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" /> Tema
              </CardTitle>
              <CardDescription>Modalità chiara o scura</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeToggle />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Tour iniziale
              </CardTitle>
              <CardDescription>Rivedi la guida introduttiva</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => setShowTour(true)}>
                Mostra tour
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifiche browser
              </CardTitle>
              <CardDescription>Avvisi al completamento delle analisi</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const ok = await requestNotificationPermission();
                  toast({ title: ok ? "Notifiche attive" : "Notifiche non concesse" });
                }}
              >
                Abilita notifiche
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
