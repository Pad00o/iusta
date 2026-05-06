import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, Sparkles } from "lucide-react";

const KEY = "iusta_onboarding_done";

const steps = [
  { title: "Benvenuto in IUSTA", body: "Analizza fascicoli di infortunistica stradale in pochi secondi. Ti mostriamo le funzioni principali." },
  { title: "Carica i documenti", body: "Trascina PDF, immagini o foto del CID nella zona di upload nella pagina Analisi." },
  { title: "Configura l'analisi", body: "Dalla barra laterale destra scegli modalità (rapida o completa), OCR e anonimizzazione." },
  { title: "Storico e Modelli", body: "Tutte le analisi vengono salvate nello Storico. In Modelli generi atti pronti all'uso." },
];

export function OnboardingTour({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) { setOpen(true); setStep(0); return; }
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, [forceOpen]);

  const close = () => {
    setOpen(false);
    localStorage.setItem(KEY, "1");
    onClose?.();
  };

  if (!open) return null;
  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 relative">
        <button onClick={close} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 mb-3 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Tour {step + 1}/{steps.length}</span>
        </div>
        <h2 className="text-xl font-bold mb-2">{s.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{s.body}</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={close}>Salta</Button>
            <Button size="sm" onClick={() => last ? close() : setStep(step + 1)}>
              {last ? "Inizia" : "Avanti"} <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
