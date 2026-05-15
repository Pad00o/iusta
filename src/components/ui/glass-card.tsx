import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "strong" | "subtle";
type Glow = "none" | "gold" | "soft";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  interactive?: boolean;
  glow?: Glow;
  as?: keyof JSX.IntrinsicElements;
}

const variantClass: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass glass-subtle",
};

const glowClass: Record<Glow, string> = {
  none: "",
  gold: "glass-glow-gold",
  soft: "glass-glow-soft",
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", interactive = false, glow = "none", as: Tag = "div", ...props }, ref) => {
    const Component = Tag as any;
    return (
      <Component
        ref={ref}
        className={cn(
          variantClass[variant],
          interactive && "glass-interactive",
          glowClass[glow],
          "shadow-elegant",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";

export const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
GlassCardHeader.displayName = "GlassCardHeader";

export const GlassCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-serif text-lg leading-tight tracking-tight", className)} {...props} />
  ),
);
GlassCardTitle.displayName = "GlassCardTitle";

export const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
  ),
);
GlassCardDescription.displayName = "GlassCardDescription";

export const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
GlassCardContent.displayName = "GlassCardContent";

export const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
GlassCardFooter.displayName = "GlassCardFooter";
