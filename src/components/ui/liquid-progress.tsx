import * as React from "react";
import { cn } from "@/lib/utils";

export interface LiquidProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value?: number;
  /** Show animated indeterminate bar */
  indeterminate?: boolean;
  /** Reduce track height (default false → 18px). When true → 8px */
  thin?: boolean;
}

export const LiquidProgress = React.forwardRef<HTMLDivElement, LiquidProgressProps>(
  ({ value = 0, indeterminate, thin, className, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clamped}
        className={cn("liquid-progress-track", thin && "h-2", className)}
        {...props}
      >
        {indeterminate ? (
          <div className="liquid-progress-fill liquid-progress-indeterminate" style={{ width: "40%" }} />
        ) : (
          <div className="liquid-progress-fill" style={{ width: `${clamped}%` }} />
        )}
      </div>
    );
  },
);
LiquidProgress.displayName = "LiquidProgress";
