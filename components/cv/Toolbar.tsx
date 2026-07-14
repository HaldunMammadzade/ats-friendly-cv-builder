"use client";

import { useCVStore } from "@/store/cvStore";
import { downloadCVPdf } from "@/lib/pdf";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import IconButton from "@/components/ui/IconButton";

export default function Toolbar() {
  const { cvs, activeId } = useCVStore();
  const cv = cvs.find((c) => c.id === activeId);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!cv) return;
    setLoading(true);
    try {
      await downloadCVPdf(cv);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!cv) return null;

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink-200 no-print">
      <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-ink-900" />
          <h1 className="font-bold text-ink-900 text-base">CV Builder</h1>
          <span className="hidden sm:inline text-xs text-ink-500 ml-2">
            Auto-saved - {cv.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton onClick={handleExport} disabled={loading} variant="primary">
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            {loading ? "Generating..." : "Export PDF"}
          </IconButton>
        </div>
      </div>
    </div>
  );
}
