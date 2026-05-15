import { useEffect, useState } from "react";
import { LiquidProgress } from "@/components/ui/liquid-progress";

interface NeonProgressBarProps {
  active: boolean;
  done?: boolean;
  label?: string;
  /** "neon" (default) keeps the cyan style. "liquid" renders the unified Liquid Glass progress. */
  variant?: "neon" | "liquid";
}

const STEPS = [
  "Estrazione testo dai documenti...",
  "Analisi cinematica e tecnica...",
  "Cross-check delle dichiarazioni...",
  "Identificazione contraddizioni...",
  "Verifica violazioni Codice della Strada...",
  "Redazione bozza atto di citazione...",
  "Finalizzazione report...",
];

export function NeonProgressBar({ active, done, label }: NeonProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (done) {
      setProgress(100);
      return;
    }
    if (!active) {
      setProgress(0);
      setStepIdx(0);
      return;
    }
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return 95;
        // Decay: faster at start, slower near end
        const inc = Math.max(0.3, (95 - p) * 0.025);
        return Math.min(95, p + inc);
      });
    }, 200);
    const stepId = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length);
    }, 2800);
    return () => {
      clearInterval(id);
      clearInterval(stepId);
    };
  }, [active, done]);

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      <div className="flex items-end justify-between mb-2 px-1">
        <span className="text-sm font-medium text-foreground/90">
          {label || (done ? "Analisi completata" : STEPS[stepIdx])}
        </span>
        <span className="text-sm font-bold text-cyan-400 tabular-nums" style={{ textShadow: "0 0 8px rgba(34,211,238,0.7)" }}>
          {Math.round(progress)}%
        </span>
      </div>

      <div
        className="relative h-5 rounded-full overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(220 40% 12%), hsl(220 40% 8%))",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.15)",
        }}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(96,165,250,1) 50%, rgba(34,211,238,0.9))",
            boxShadow:
              "0 0 12px rgba(34,211,238,0.9), 0 0 24px rgba(59,130,246,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {/* Shimmer */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 14px)",
              animation: "neonShimmer 1.6s linear infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes neonShimmer {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
}
