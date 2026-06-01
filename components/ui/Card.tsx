import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({ className, glow, interactive, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-ink-700/40 bg-ink-875/60 backdrop-blur-xl",
        "shadow-card",
        interactive && "transition-all duration-300 hover:border-ink-700/50 hover:shadow-card-hover",
        glow && "before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-radial-glow before:opacity-60",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pb-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 pb-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent", className)} />;
}
