import { useEffect, useState } from "react";
import { Check, Loader2, Circle, FileSearch, Gauge, Users, FileSignature } from "lucide-react";

interface Step {
  label: string;
  Icon: typeof Check;
  /** rough seconds before this step is considered done if no signal */
  estSec: number;
}

const STEPS: Step[] = [
  { label: "Estrazione testo da PDF e OCR", Icon: FileSearch, estSec: 8 },
  { label: "Calcolo velocità cinematica e dinamica", Icon: Gauge, estSec: 14 },
  { label: "Verifica coerenza testimoniale e cross-check", Icon: Users, estSec: 18 },
  { label: "Generazione report finale e bozza legale", Icon: FileSignature, estSec: 30 },
];

interface Props {
  active: boolean;
  /** when true, mark all as done */
  done?: boolean;
  /** number of streamed chars — accelerates progression once tokens flow */
  streamedChars?: number;
}

export function AnalysisChecklist({ active, done, streamedChars = 0 }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || done) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active, done]);

  // Map elapsed → currentIdx
  let acc = 0;
  let currentIdx = STEPS.length;
  for (let i = 0; i < STEPS.length; i++) {
    acc += STEPS[i].estSec;
    if (elapsed < acc) {
      currentIdx = i;
      break;
    }
  }
  // When tokens start streaming we know step 4 is in progress
  if (streamedChars > 0) currentIdx = Math.max(currentIdx, 3);
  if (done) currentIdx = STEPS.length;

  return (
    <div className="w-full max-w-xl mx-auto glass rounded-3xl p-7 shadow-elegant">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-2xl gold-bg flex items-center justify-center shadow-gold-glow">
          <Loader2 className={`h-5 w-5 text-primary-foreground ${done ? "" : "animate-spin"}`} />
        </div>
        <div>
          <h3 className="font-serif text-lg text-foreground leading-tight">
            {done ? "Analisi completata" : "Analisi in corso"}
          </h3>
          <p className="text-xs text-muted-foreground">
            IUSTA sta elaborando il fascicolo con precisione chirurgica.
          </p>
        </div>
      </div>

      <ol className="space-y-3 relative">
        <span
          aria-hidden
          className="absolute left-[19px] top-3 bottom-3 w-px bg-border/20"
        />
        {STEPS.map((step, i) => {
          const status: "done" | "running" | "pending" =
            i < currentIdx ? "done" : i === currentIdx ? "running" : "pending";
          const Icon = step.Icon;
          return (
            <li
              key={step.label}
              className={`relative flex items-start gap-4 transition-opacity duration-500 ${
                status === "pending" ? "opacity-50" : "opacity-100"
              }`}
            >
              <div
                className={`relative z-10 mt-0.5 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  status === "done"
                    ? "bg-primary/15 text-primary border border-primary/40"
                    : status === "running"
                    ? "bg-primary/10 text-primary border border-primary/60 shadow-gold-glow"
                    : "bg-muted/50 text-muted-foreground border border-border/20"
                }`}
              >
                {status === "done" ? (
                  <Check className="h-4 w-4" />
                ) : status === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <div className="pt-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span
                    className={`text-sm ${
                      status === "running"
                        ? "text-foreground font-medium"
                        : status === "done"
                        ? "text-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {status === "running" && (
                  <div className="mt-1 h-0.5 w-32 rounded-full bg-border/20 overflow-hidden">
                    <div className="h-full w-1/2 gold-bg animate-pulse" />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
