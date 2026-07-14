"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// A4 width in px at 96dpi (210mm)
const A4_WIDTH_PX = 794;

export function useFitScale(targetWidthPx: number = A4_WIDTH_PX) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [scaledHeight, setScaledHeight] = useState(600);

  const compute = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container) return;

    const available = container.clientWidth;
    if (available > 0) {
      const next = Math.min(1, available / targetWidthPx);
      setScale(next);
      if (content) {
        const realHeight = content.offsetHeight;
        if (realHeight > 0) {
          setScaledHeight(realHeight * next);
        }
      }
    }
  }, [targetWidthPx]);

  useEffect(() => {
    // Run after paint, and once more shortly after (fonts/layout settle)
    compute();
    const t1 = setTimeout(compute, 50);
    const t2 = setTimeout(compute, 300);

    const container = containerRef.current;
    const content = contentRef.current;

    const ro = new ResizeObserver(() => compute());
    if (container) ro.observe(container);
    if (content) ro.observe(content);
    window.addEventListener("resize", compute);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [compute]);

  return { containerRef, contentRef, scale, scaledHeight, recompute: compute };
}
