"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { FONT_OPTIONS, TEMPLATES } from "@/lib/cv/templates";
import { SECTION_LABELS } from "@/types/cv";
import type { FontFamilyId } from "@/types/cv";
import { Slider } from "@/components/ui/Primitives";
import { TextInput } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/Primitives";
import { SectionShell } from "./parts";
import { cn } from "@/lib/cn";

const DEFAULT_ACCENT = "#111827";

const ACCENTS = [
  { value: DEFAULT_ACCENT, label: "Black" },
  { value: "#1e40af", label: "Navy" },
  { value: "#0f5132", label: "Forest" },
  { value: "#7c2d12", label: "Rust" },
  { value: "#4c1d95", label: "Plum" },
  { value: "#374151", label: "Slate" },
];

export default function DesignTab() {
  const design = useEditorStore((s) => s.cv.design);
  const sections = useEditorStore((s) => s.cv.sections);
  const pages = useEditorStore((s) => s.ats.stats?.estimatedPages ?? 0);
  const mutate = useEditorStore((s) => s.mutate);

  const moveSection = (index: number, delta: number) =>
    mutate((d) => {
      const target = index + delta;
      if (target < 0 || target >= d.sections.length) return;
      const [item] = d.sections.splice(index, 1);
      d.sections.splice(target, 0, item);
    });

  return (
    <div className="space-y-3">
      <SectionShell
        title="Template"
        description="All three are single-column with no tables, images or icons — the layout traits that break resume parsers. They differ only in typography and density."
      >
        <div className="space-y-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() =>
                mutate((d) => {
                  d.design.template = template.id;
                  // Modern is the only template that paints the accent, so
                  // switching to it while the colour is still the default near
                  // black would look identical to Classic.
                  if (
                    template.id === "modern" &&
                    d.design.accentColor === DEFAULT_ACCENT
                  ) {
                    d.design.accentColor = "#1e40af";
                  }
                })
              }
              className={cn(
                "w-full rounded-lg border px-3.5 py-3 text-left transition-colors",
                design.template === template.id
                  ? "border-ink-900 bg-ink-50"
                  : "border-line hover:border-ink-300 hover:bg-ink-50/60"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink-900">
                  {template.name}
                </span>
                {design.template === template.id && (
                  <span className="text-[11px] font-medium text-ink-500">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                {template.description}
              </p>
              <p className="mt-1.5 text-[11px] text-ink-400">
                Best for: {template.bestFor}
              </p>
            </button>
          ))}
        </div>
      </SectionShell>

      <SectionShell title="Typography">
        <div className="space-y-5">
          <div>
            <span className="field-label">Font</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() =>
                    mutate((d) => {
                      d.design.fontFamily = font.id as FontFamilyId;
                    })
                  }
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-colors",
                    design.fontFamily === font.id
                      ? "border-ink-900 bg-ink-50"
                      : "border-line hover:border-ink-300"
                  )}
                >
                  <span className="block text-[12px] font-medium text-ink-900">
                    {font.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">
                    {font.note}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              Limited to fonts every PDF viewer embeds natively. A custom
              webfont is the fastest way to turn your text into unreadable
              glyphs inside a parser.
            </p>
          </div>

          <Slider
            label="Body size"
            value={design.fontSize}
            min={9}
            max={12}
            step={0.25}
            format={(v) => `${v} pt`}
            onChange={(v) =>
              mutate((d) => {
                d.design.fontSize = v;
              })
            }
          />

          <Slider
            label="Line height"
            value={design.lineHeight}
            min={1.1}
            max={1.7}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) =>
              mutate((d) => {
                d.design.lineHeight = v;
              })
            }
          />

          <Slider
            label="Section spacing"
            value={design.sectionSpacing}
            min={4}
            max={20}
            step={0.5}
            format={(v) => `${v} pt`}
            onChange={(v) =>
              mutate((d) => {
                d.design.sectionSpacing = v;
              })
            }
          />

          <Slider
            label="Page margin"
            value={design.margin}
            min={10}
            max={25}
            step={1}
            format={(v) => `${v} mm`}
            onChange={(v) =>
              mutate((d) => {
                d.design.margin = v;
              })
            }
          />

          <div
            className={cn(
              "rounded-lg border px-3 py-2 text-[12px] leading-relaxed",
              pages > 2
                ? "border-danger/25 bg-danger/5 text-danger"
                : pages > 1.05
                  ? "border-warn/25 bg-warn/5 text-warn"
                  : "border-line bg-ink-50 text-ink-600"
            )}
          >
            Currently about {pages} page{pages === 1 ? "" : "s"}.{" "}
            {pages > 1.05
              ? "Drop the body size a quarter point or tighten section spacing before you cut content."
              : "Comfortably within a single page."}
          </div>
        </div>
      </SectionShell>

      <SectionShell title="Colour & paper" defaultOpen={false}>
        <div className="space-y-5">
          <div>
            <span className="field-label">Accent colour</span>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.value}
                  type="button"
                  title={accent.label}
                  onClick={() =>
                    mutate((d) => {
                      d.design.accentColor = accent.value;
                    })
                  }
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    design.accentColor === accent.value
                      ? "border-ink-900 scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: accent.value }}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              Only the Modern template applies the accent. Body text stays near
              black everywhere so it survives greyscale printing.
            </p>
          </div>

          <div>
            <span className="field-label">Paper size</span>
            <div className="flex gap-2">
              {(["a4", "letter"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    mutate((d) => {
                      d.design.paperSize = size;
                    })
                  }
                  className={cn(
                    "rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors",
                    design.paperSize === size
                      ? "border-ink-900 bg-ink-50 text-ink-900"
                      : "border-line text-ink-600 hover:border-ink-300"
                  )}
                >
                  {size === "a4" ? "A4" : "US Letter"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              A4 for Europe and most of the world, Letter for the US and Canada.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Sections"
        description="Reorder or hide sections. Hidden sections keep their content — nothing is deleted."
        defaultOpen={false}
      >
        <ul className="space-y-1.5">
          {sections.map((section, index) => (
            <li
              key={section.key}
              className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5"
            >
              <div className="flex flex-col">
                <IconButton
                  label="Move up"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="h-4 w-6"
                >
                  <ArrowUp className="h-3 w-3" />
                </IconButton>
                <IconButton
                  label="Move down"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  className="h-4 w-6"
                >
                  <ArrowDown className="h-3 w-3" />
                </IconButton>
              </div>

              <TextInput
                wrapperClassName="flex-1"
                value={section.title}
                onChange={(e) =>
                  mutate((d) => {
                    d.sections[index].title = e.target.value;
                  })
                }
                placeholder={SECTION_LABELS[section.key]}
                className="h-8 text-[13px]"
              />

              <IconButton
                label={section.visible ? "Hide section" : "Show section"}
                onClick={() =>
                  mutate((d) => {
                    d.sections[index].visible = !d.sections[index].visible;
                  })
                }
              >
                {section.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-ink-300" />
                )}
              </IconButton>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
          Renaming to something creative costs you points — parsers map
          &quot;Work Experience&quot; to a known field and &quot;My
          Journey&quot; to nothing.
        </p>
      </SectionShell>
    </div>
  );
}
