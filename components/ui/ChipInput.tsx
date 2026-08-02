"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field } from "./Field";

/**
 * Tag-style editor for string lists (skills, tech stacks).
 *
 * Comma, Enter and Tab all commit the current token, and pasting a
 * comma-separated list splits it — pasting straight from a job posting is the
 * most common way this gets used.
 */
export default function ChipInput({
  label,
  hint,
  value,
  onChange,
  placeholder = "Type and press Enter",
  suggestions = [],
  max = 40,
}: {
  label?: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;

    const existing = new Set(value.map((v) => v.toLowerCase()));
    const additions = parts.filter((p) => {
      const key = p.toLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });

    if (additions.length) onChange([...value, ...additions].slice(0, max));
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      if (!draft.trim()) return;
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const unusedSuggestions = suggestions
    .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
    .slice(0, 6);

  return (
    <Field label={label} hint={hint}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-[38px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg",
          "border border-line bg-white px-2 py-1.5 transition-colors",
          "hover:border-ink-300 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10"
        )}
      >
        {value.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-ink-100 py-0.5 pl-2 pr-1 text-[13px] text-ink-800"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((_, index) => index !== i));
              }}
              className="rounded p-0.5 text-ink-400 transition-colors hover:bg-ink-200 hover:text-ink-700"
              aria-label={`Remove ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!text.includes(",")) return;
            e.preventDefault();
            commit(text);
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[110px] flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-ink-400">Suggested:</span>
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className="rounded-md border border-dashed border-ink-300 px-1.5 py-0.5 text-[11px] text-ink-500 transition-colors hover:border-brand-600 hover:text-brand-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}
