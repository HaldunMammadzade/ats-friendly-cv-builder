"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 disabled:bg-ink-300",
  secondary:
    "bg-ink-100 text-ink-800 hover:bg-ink-200 active:bg-ink-300 disabled:text-ink-400",
  outline:
    "border border-line bg-white text-ink-700 hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-300",
  ghost:
    "text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200 disabled:text-ink-300",
  danger:
    "bg-danger text-white hover:brightness-95 active:brightness-90 disabled:bg-ink-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-[38px] px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
  icon: "h-9 w-9 justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    className,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});

export default Button;
