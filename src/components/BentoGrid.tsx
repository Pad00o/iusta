import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]", className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** col-span / row-span etc. */
  span?: string;
  accent?: boolean;
}

export function BentoCard({ children, className, span, accent }: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative group rounded-3xl glass shadow-elegant p-6 overflow-hidden transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-gold-glow hover:border-primary/30",
        accent && "border-primary/30",
        span,
        className,
      )}
    >
      {accent && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      )}
      {children}
    </div>
  );
}
