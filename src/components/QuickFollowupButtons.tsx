import { Calculator, Euro, Users, FileSignature, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const FOLLOWUPS = [
  { icon: Calculator, label: "Calcola danno biologico", prompt: "Calcola il danno biologico stimato secondo le tabelle del Tribunale di Milano (ultimo aggiornamento). Indica voci, percentuali e importo finale." },
  { icon: Euro, label: "Stima risarcimento", prompt: "Fornisci una stima dettagliata del risarcimento totale (danno patrimoniale + non patrimoniale + spese mediche) basata sui dati del fascicolo." },
  { icon: Users, label: "Estrai testimoni", prompt: "Estrai un elenco strutturato di tutti i testimoni citati nel fascicolo con: nome, ruolo, dichiarazione sintetica e attendibilità." },
  { icon: FileSignature, label: "Genera atto di citazione", prompt: "Redigi una bozza completa di Atto di Citazione in linguaggio giuridico formale italiano basata sull'analisi del fascicolo." },
  { icon: Brain, label: "Riassumi in 3 punti", prompt: "Riassumi l'intero report in massimo 3 bullet point chiave per una valutazione rapida." },
];

export function QuickFollowupButtons({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 flex-wrap mb-2">
      {FOLLOWUPS.map((f) => (
        <Button
          key={f.label}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSend(f.prompt)}
          className="text-xs h-7"
        >
          <f.icon className="h-3 w-3 mr-1" />
          {f.label}
        </Button>
      ))}
    </div>
  );
}
