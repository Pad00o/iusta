import { useState } from "react";
import { Settings as SettingsIcon, Info, Palette, FileDown, BookOpen, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requestNotificationPermission } from "@/hooks/useBrowserNotifications";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [showTour, setShowTour] = useState(false);
  return (
    <div className="flex-1 overflow-auto">
      {showTour && <OnboardingTour forceOpen onClose={() => setShowTour(false)} />}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Impostazioni</h1>

        <div className="space-y-4">
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
              <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Tema</CardTitle>
              <CardDescription>Modalità chiara o scura</CardDescription>
            </CardHeader>
            <CardContent><ThemeToggle /></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Tour iniziale</CardTitle>
              <CardDescription>Rivedi la guida introduttiva</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => setShowTour(true)}>Mostra tour</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifiche browser</CardTitle>
              <CardDescription>Avvisi al completamento delle analisi</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={async () => {
                const ok = await requestNotificationPermission();
                toast({ title: ok ? "Notifiche attive" : "Notifiche non concesse" });
              }}>Abilita notifiche</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
