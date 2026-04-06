import { Check } from "lucide-react";

const steps = [
  { id: 1, label: "Caricamento" },
  { id: 2, label: "Elaborazione" },
  { id: 3, label: "Analisi IA" },
  { id: 4, label: "Report" },
];

interface AnalysisStepperProps {
  currentStep: number;
}

export function AnalysisStepper({ currentStep }: AnalysisStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, i) => {
        const completed = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  completed
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {completed ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  completed ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
