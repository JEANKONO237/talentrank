import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "amber" | "glass" | "go";
type Size = "sm" | "md" | "lg";

// Duolingo-style chunky 3D buttons with solid border-bottom + squash on press.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white border-b-[3px] border-duo-blue-deep hover:brightness-105 active:translate-y-[2px] active:border-b-[1px] focus-visible:ring-duo-blue/40",
  go:
    "bg-gradient-to-b from-duo-green to-[#48AB02] text-white border-b-[3px] border-duo-green-deep hover:brightness-105 active:translate-y-[2px] active:border-b-[1px] focus-visible:ring-duo-green/40",
  amber:
    "bg-gradient-to-b from-duo-yellow to-[#F0B900] text-mist-50 border-b-[3px] border-duo-yellow-deep hover:brightness-[1.03] active:translate-y-[2px] active:border-b-[1px] focus-visible:ring-duo-yellow/40",
  secondary:
    "bg-ink-900 text-mist-100 border-b-[3px] border-ink-700 ring-1 ring-ink-700/60 hover:bg-ink-850 active:translate-y-[2px] active:border-b-[1px] focus-visible:ring-duo-blue/40",
  ghost:
    "text-mist-200 hover:text-mist-50 hover:bg-ink-850 focus-visible:ring-duo-blue/40",
  glass:
    "bg-ink-900 text-mist-200 border-b-[3px] border-ink-700 ring-1 ring-ink-700/50 hover:bg-ink-850 hover:border-ink-600 active:translate-y-[2px] active:border-b-[1px] focus-visible:ring-duo-blue/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold uppercase tracking-[0.04em] transition-all duration-100 focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap will-change-transform";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
});

interface ButtonLinkProps extends CommonProps {
  href: string;
  target?: string;
  rel?: string;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
