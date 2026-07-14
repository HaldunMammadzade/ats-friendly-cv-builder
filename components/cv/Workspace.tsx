"use client";

import { useEffect, useState } from "react";
import { useCVStore } from "@/store/cvStore";
import { useFitScale } from "@/hooks/useFitScale";
import CVSwitcher from "./CVSwitcher";
import Editor from "./Editor";
import CVPreview from "./CVPreview";
import Toolbar from "./Toolbar";

export default function Workspace() {
  const { cvs, activeId, hydrated } = useCVStore();
  const [mounted, setMounted] = useState(false);
  const { containerRef, contentRef, scale, scaledHeight } = useFitScale(794);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-400 text-sm">
        Loading
      </div>
    );
  }

  const cv = cvs.find((c) => c.id === activeId) ?? cvs[0];

  return (
    <div className="min-h-screen">
      <Toolbar />

      <div className="max-w-[1500px] mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-20">
            <CVSwitcher />
          </div>
        </aside>

        <main className="lg:col-span-4">
          <Editor />
        </main>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <div className="text-xs text-ink-500 mb-2 px-1">
              Live preview - A4 - ATS-friendly
            </div>
            <div
              ref={containerRef}
              className="overflow-y-auto overflow-x-hidden rounded-lg border border-ink-200 bg-ink-100"
              style={{ maxHeight: "calc(100vh - 7rem)" }}
            >
              {cv && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: scaledHeight,
                  }}
                >
                  <div
                    ref={contentRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 794,
                      transform: "scale(" + scale + ")",
                      transformOrigin: "top left",
                    }}
                  >
                    <CVPreview cv={cv} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
