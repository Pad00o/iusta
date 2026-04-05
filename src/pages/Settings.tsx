import { Settings as SettingsIcon, Info, Palette, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="flex-1 overflow-auto">
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
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" /> Tema
              </CardTitle>
              <CardDescription>Personalizzazione dell'aspetto (prossimamente)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Le opzioni di personalizzazione del tema saranno disponibili in una versione futura.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="h-4 w-4" /> Export
              </CardTitle>
              <CardDescription>Opzioni di esportazione dati (prossimamente)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Le funzionalità di esportazione massiva saranno disponibili in una versione futura.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
