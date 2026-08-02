"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  GripVertical,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui/Primitives";
import Button from "@/components/ui/Button";
import { ACTION_VERBS } from "@/lib/ats/dictionary";
import { isQuantified, leadingWord } from "@/lib/ats/text";

/** Collapsible group wrapper used for each editor section. */
export function SectionShell({
  title,
  description,
  count,
  children,
  defaultOpen = true,
  headerRight,
}: {
  title: string;
  description?: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean;
  headerRight?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-ink-400 transition-transform",
              !open && "-rotate-90"
            )}
          />
          <span className="text-sm font-semibold text-ink-900">{title}</span>
          {typeof count === "number" && (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-500">
              {count}
            </span>
          )}
        </button>
        {headerRight}
      </div>

      {open && (
        <div className="border-t border-line px-4 py-4">
          {description && (
            <p className="mb-4 text-[12px] leading-relaxed text-ink-500">
              {description}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

/** A draggable, collapsible card for one repeatable entry. */
export function EntryCard({
  id,
  title,
  subtitle,
  onRemove,
  children,
  defaultOpen = false,
  warning,
}: {
  id: string;
  title: string;
  subtitle?: string;
  onRemove: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
  warning?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-white",
        isDragging && "opacity-60 shadow-pop"
      )}
    >
      <div className="flex items-center gap-1 pl-1 pr-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded p-1.5 text-ink-300 transition-colors hover:bg-ink-100 hover:text-ink-600 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink-900">
              {title || <span className="text-ink-400">Untitled</span>}
            </span>
            {subtitle && (
              <span className="block truncate text-[12px] text-ink-500">
                {subtitle}
              </span>
            )}
          </span>
          {warning && !open && (
            <span title={warning}>
              <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-warn" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-ink-400 transition-transform",
              !open && "-rotate-90"
            )}
          />
        </button>

        <IconButton label="Remove entry" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      {open && (
        <div className="space-y-4 border-t border-line bg-ink-50/40 px-3 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function AddEntryButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-300 py-2.5 text-[13px] font-medium text-ink-500 transition-colors hover:border-ink-400 hover:bg-ink-50 hover:text-ink-800"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/**
 * Bullet list editor with per-line ATS feedback.
 *
 * The hints mirror the two checks that move the score most — a strong opening
 * verb and a number — shown while the bullet is being written rather than in a
 * report afterwards.
 */
export function BulletEditor({
  bullets,
  onChange,
  placeholder = "Reduced API latency by 62% by adding a Redis cache layer",
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const update = (index: number, value: string) =>
    onChange(bullets.map((b, i) => (i === index ? value : b)));

  const remove = (index: number) =>
    onChange(bullets.filter((_, i) => i !== index));

  return (
    <div>
      <span className="field-label">Achievements</span>

      <div className="space-y-2">
        {bullets.map((bullet, index) => {
          const trimmed = bullet.trim();
          const hints: string[] = [];
          if (trimmed) {
            if (!ACTION_VERBS.has(leadingWord(trimmed))) {
              hints.push("Open with an action verb");
            }
            if (!isQuantified(trimmed)) hints.push("Add a number");
            const wordCount = trimmed.split(/\s+/).length;
            if (wordCount > 34) hints.push("Too long — split it");
            else if (wordCount < 8) hints.push("Too short to show impact");
          }

          return (
            <div key={index}>
              <div className="flex items-start gap-1.5">
                <span className="mt-2.5 select-none text-ink-300">•</span>
                <textarea
                  value={bullet}
                  onChange={(e) => update(index, e.target.value)}
                  rows={2}
                  placeholder={index === 0 ? placeholder : "Next achievement…"}
                  className={cn(
                    "min-h-[54px] w-full resize-y rounded-lg border border-line bg-white px-3 py-2",
                    "text-[13px] leading-relaxed text-ink-900 placeholder:text-ink-400",
                    "transition-colors hover:border-ink-300 focus:border-brand-600",
                    "focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                  )}
                />
                <IconButton
                  label="Remove bullet"
                  onClick={() => remove(index)}
                  className="mt-1.5"
                  disabled={bullets.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>

              {hints.length > 0 && (
                <div className="ml-4 mt-1 flex flex-wrap gap-1.5">
                  {hints.map((hint) => (
                    <span
                      key={hint}
                      className="rounded bg-warn/10 px-1.5 py-0.5 text-[11px] text-warn"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-2"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => onChange([...bullets, ""])}
      >
        Add achievement
      </Button>
    </div>
  );
}

/** Wraps a list of EntryCards in a drag-and-drop context. */
export { SortableGroup } from "./SortableGroup";
