"use client";

import {
  useEffect,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "pass" | "warn" | "danger" | "brand";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-600",
    pass: "bg-pass/10 text-pass",
    warn: "bg-warn/10 text-warn",
    danger: "bg-danger/10 text-danger",
    brand: "bg-brand-50 text-brand-700",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-400",
        "transition-colors hover:bg-ink-100 hover:text-ink-700",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-ink-900" : "bg-ink-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm text-ink-800">{label}</span>
        {description && (
          <span className="block text-xs text-ink-500">{description}</span>
        )}
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          {label}
        </span>
        <span className="font-mono text-[11px] text-ink-600">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-ink-900"
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-2xl bg-white shadow-pop sm:max-h-[min(85dvh,720px)] sm:animate-scale-in sm:rounded-xl",
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer && (
          <div className="safe-bottom flex shrink-0 flex-col-reverse gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Circular ATS score gauge. */
export function ScoreRing({
  score,
  size = 84,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = size / 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  const color =
    clamped >= 85 ? "#0f9d58" : clamped >= 65 ? "#c2820b" : "#d1373c";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e9edf2"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 450ms ease, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none text-ink-900"
          style={{ fontSize: size / 3.4 }}
        >
          {clamped}
        </span>
        {label && (
          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
