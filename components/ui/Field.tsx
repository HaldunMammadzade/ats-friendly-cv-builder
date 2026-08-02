"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const CONTROL_BASE =
  "w-full rounded-lg border border-line bg-white px-3 text-sm text-ink-900 " +
  "placeholder:text-ink-400 transition-colors " +
  "hover:border-ink-300 focus:border-brand-600 focus:outline-none " +
  "focus:ring-4 focus:ring-brand-600/10 disabled:bg-ink-50 disabled:text-ink-400";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
  action,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {(label || action) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && (
            <label
              htmlFor={htmlFor}
              className="text-[11px] font-semibold uppercase tracking-wider text-ink-500"
            >
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { label, hint, error, className, wrapperClassName, id, ...props },
    ref
  ) {
    const generated = useId();
    const inputId = id ?? generated;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        className={wrapperClassName}
      >
        <input
          ref={ref}
          id={inputId}
          className={cn(
            CONTROL_BASE,
            "h-[38px]",
            error && "border-danger focus:border-danger focus:ring-danger/10",
            className
          )}
          {...props}
        />
      </Field>
    );
  }
);

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  action?: ReactNode;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    { label, hint, error, className, wrapperClassName, action, id, ...props },
    ref
  ) {
    const generated = useId();
    const inputId = id ?? generated;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        className={wrapperClassName}
        action={action}
      >
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            CONTROL_BASE,
            "min-h-[92px] resize-y py-2 leading-relaxed",
            error && "border-danger focus:border-danger focus:ring-danger/10",
            className
          )}
          {...props}
        />
      </Field>
    );
  }
);

export interface SelectInputProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  wrapperClassName?: string;
  options: { value: string; label: string }[];
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput(
    { label, hint, className, wrapperClassName, options, id, ...props },
    ref
  ) {
    const generated = useId();
    const inputId = id ?? generated;

    return (
      <Field
        label={label}
        hint={hint}
        htmlFor={inputId}
        className={wrapperClassName}
      >
        <select
          ref={ref}
          id={inputId}
          className={cn(CONTROL_BASE, "h-[38px] cursor-pointer pr-8", className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }
);
