import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const baseField =
  "h-11 w-full rounded-xl border border-ink-700/40 bg-ink-900/60 px-3.5 text-[14px] text-mist-50 placeholder:text-mist-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(baseField, className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(baseField, "appearance-none pr-8", className)} {...rest}>
        {children}
      </select>
    );
  },
);

export function Field({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-mist-400">
          {label}
        </span>
        {action}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-mist-500">{hint}</p>}
    </label>
  );
}
