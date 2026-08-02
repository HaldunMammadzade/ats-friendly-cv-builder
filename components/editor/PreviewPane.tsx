"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Ruler } from "lucide-react";
import CVPreview from "@/components/cv/CVPreview";
import { useEditorStore } from "@/store/editorStore";
import { IconButton } from "@/components/ui/Primitives";
import { MM_TO_PX } from "@/lib/cv/templates";
import { cn } from "@/lib/cn";

/**
 * Scales the fixed-width page to whatever space is left over.
 *
 * The page itself is rendered at true physical size and scaled with a
 * transform, so the preview stays pixel-accurate against the PDF instead of
 * reflowing at small widths.
 */
export default function PreviewPane() {
  const cv = useEditorStore((s) => s.cv);
  const pages = useEditorStore((s) => s.ats.stats?.estimatedPages ?? 1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.75);
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState(true);

  const pageWidthPx = cv.design ? cv.design.paperSize === "a4" ? 210 * MM_TO_PX : 215.9 * MM_TO_PX : 210 * MM_TO_PX;

  const measure = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    const available = node.clientWidth - 48;
    setFitScale(Math.min(1.1, Math.max(0.35, available / pageWidthPx)));
  }, [pageWidthPx]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const scale = fitScale * zoom;

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-3 py-2">
        <span className="text-[11px] text-ink-500 sm:text-[12px]">
          {cv.design?.paperSize === "letter" ? "US Letter" : "A4"} ·{" "}
          <span className={cn(pages > 2 && "text-danger")}>
            ~{pages} page{pages === 1 ? "" : "s"}
          </span>
        </span>

        <div className="flex items-center gap-1">
          <IconButton
            label={guides ? "Hide page breaks" : "Show page breaks"}
            onClick={() => setGuides((v) => !v)}
            className={cn(guides && "bg-ink-100 text-ink-700")}
          >
            <Ruler className="h-3.5 w-3.5" />
          </IconButton>

          <IconButton
            label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          >
            <Minus className="h-3.5 w-3.5" />
          </IconButton>

          <button
            type="button"
            onClick={() => setZoom(1)}
            className="w-12 rounded px-1 py-1 text-center font-mono text-[11px] text-ink-600 hover:bg-ink-100"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <IconButton
            label="Zoom in"
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          >
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto p-3 pb-24 md:p-6 md:pb-6">
        <div
          className="mx-auto"
          style={{
            width: pageWidthPx * scale,
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: pageWidthPx,
            }}
            className="shadow-pop"
          >
            <CVPreview cv={cv} showPageGuides={guides} />
          </div>
        </div>
      </div>
    </div>
  );
}
