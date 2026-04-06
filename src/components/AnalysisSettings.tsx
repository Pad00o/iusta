import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lightbulb, FileText, Camera, Car, Users, ClipboardList } from "lucide-react";

export interface AnalysisConfig {
  mode: "completa" | "rapida";
  detail: "standard" | "avanzato";
  ocrAdvanced: boolean;
  anonymize: boolean;
}

interface AnalysisSettingsProps {
  config: AnalysisConfig;
  onChange: (config: AnalysisConfig) => void;
}

const suggestions = [
  { icon: ClipboardList, label: "Verbali di Polizia" },
  { icon: FileText, label: "CID / CAI" },
  { icon: FileText, label: "Referti medici" },
  { icon: Camera, label: "Foto del sinistro" },
  { icon: Car, label: "Perizie tecniche" },
  { icon: Users, label: "Testimonianze" },
];

export function AnalysisSettings({ config, onChange }: AnalysisSettingsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Suggerimenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            Documenti consigliati per un'analisi completa:
          </p>
          {suggestions.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="h-3.5 w-3.5 text-primary/70" />
              <span>{s.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Impostazioni analisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Modalità</Label>
            <Select
              value={config.mode}
              onValueChange={(v) => onChange({ ...config, mode: v as "completa" | "rapida" })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completa">Completa</SelectItem>
                <SelectItem value="rapida">Rapida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Livello dettaglio</Label>
            <Select
              value={config.detail}
              onValueChange={(v) => onChange({ ...config, detail: v as "standard" | "avanzato" })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="avanzato">Avanzato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">OCR avanzato</Label>
            <Switch
              checked={config.ocrAdvanced}
              onCheckedChange={(v) => onChange({ ...config, ocrAdvanced: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Anonimizzazione</Label>
            <Switch
              checked={config.anonymize}
              onCheckedChange={(v) => onChange({ ...config, anonymize: v })}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-primary">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            RAG attivo
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Privacy e sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            I documenti vengono elaborati in modo sicuro. I dati sensibili (CF, telefoni, indirizzi)
            vengono automaticamente anonimizzati nel report finale.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
