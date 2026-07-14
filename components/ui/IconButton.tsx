"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger" | "outline";
}

export default function IconButton({
  children,
  variant = "ghost",
  className = "",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-700 shadow-sm",
    ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
    danger: "text-red-600 hover:bg-red-50",
    outline:
      "border border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50",
  };

  return (
    <button {...rest} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
