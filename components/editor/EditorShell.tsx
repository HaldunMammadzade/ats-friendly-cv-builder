"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Cloud,
  Download,
  FileText,
  History,
  LayoutPanelLeft,
  Loader2,
  Palette,
  ShieldCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editorStore";
import { useAutosave } from "@/hooks/useAutosave";
import { api, ApiError, downloadBlob } from "@/lib/api/client";
import { fileSlug } from "@/lib/cv/format";
import type { ResumeDetail } from "@/lib/api/resumes";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import ContentTab from "./ContentTab";
import DesignTab from "./DesignTab";
import AtsTab from "./AtsTab";
import MatchTab from "./MatchTab";
import VersionsTab from "./VersionsTab";
import PreviewPane from "./PreviewPane";

type TabId = "content" | "design" | "ats" | "match" | "versions";

const TABS: { id: TabId; label: string; shortLabel?: string; icon: typeof FileText }[] = [
  { id: "content", label: "Content", icon: FileText },
  { id: "design", label: "Design", icon: Palette },
  { id: "ats", label: "ATS", icon: ShieldCheck },
  { id: "match", label: "Job match", shortLabel: "Match", icon: Target },
  { id: "versions", label: "History", icon: History },
];

export default function EditorShell({ resume }: { resume: ResumeDetail }) {
  const initialize = useEditorStore((s) => s.initialize);
  const cv = useEditorStore((s) => s.cv);
  const score = useEditorStore((s) => s.ats?.score ?? 0);
  const mutate = useEditorStore((s) => s.mutate);
  const ready = useEditorStore((s) => Boolean(s.cv?.id));

  const [tab, setTab] = useState<TabId>("content");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");

  const { saveNow } = useAutosave();

  useEffect(() => {
    initialize(resume.id, resume.data);
  }, [initialize, resume]);

  if (!ready) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col supports-[height:100dvh]:h-[calc(100dvh-3.5rem)]">
      <header className="flex shrink-0 flex-col gap-2 border-b border-line bg-white px-2 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <input
            value={cv.name}
            onChange={(e) =>
              mutate((d) => {
                d.name = e.target.value;
              })
            }
            aria-label="CV name"
            className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold text-ink-900 transition-colors hover:border-line focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10 sm:max-w-[280px] sm:flex-none"
          />

          <SaveIndicator onRetry={saveNow} compact />
        </div>

        <div className="flex items-center justify-between gap-2 sm:ml-auto sm:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium sm:px-2.5 sm:py-1.5 sm:text-[12px]",
              score >= 85
                ? "bg-pass/10 text-pass"
                : score >= 65
                  ? "bg-warn/10 text-warn"
                  : "bg-danger/10 text-danger"
            )}
            title="ATS readiness score"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            ATS {score}
          </span>

          <ExportMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Editing column */}
        <div
          className={cn(
            "flex min-h-0 w-full flex-col border-r border-line bg-ink-50 md:w-[min(44%,480px)] md:shrink-0 lg:w-[560px] xl:w-[620px]",
            mobilePane === "preview" && "hidden md:flex"
          )}
        >
          <nav className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-line bg-white px-1.5 pb-px sm:px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[12px] font-medium transition-colors sm:px-3 sm:text-[13px]",
                    active
                      ? "text-ink-900"
                      : "text-ink-500 hover:text-ink-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  {active && (
                    <span className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-ink-900 sm:inset-x-2" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 md:pb-3">
            {tab === "content" && <ContentTab />}
            {tab === "design" && <DesignTab />}
            {tab === "ats" && <AtsTab />}
            {tab === "match" && <MatchTab />}
            {tab === "versions" && <VersionsTab saveNow={saveNow} />}
          </div>
        </div>

        {/* Preview column */}
        <div
          className={cn(
            "min-h-0 flex-1",
            mobilePane === "edit" && "hidden md:block"
          )}
        >
          <PreviewPane />
        </div>
      </div>

      {/* Mobile pane switch — phones only */}
      <button
        type="button"
        onClick={() =>
          setMobilePane((p) => (p === "edit" ? "preview" : "edit"))
        }
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-[13px] font-medium text-white shadow-pop md:hidden"
      >
        <LayoutPanelLeft className="h-4 w-4" />
        {mobilePane === "edit" ? "Show preview" : "Back to editor"}
      </button>
    </div>
  );
}

function SaveIndicator({
  onRetry,
  compact = false,
}: {
  onRetry: () => Promise<void>;
  compact?: boolean;
}) {
  const status = useEditorStore((s) => s.status);
  const errorMessage = useEditorStore((s) => s.errorMessage);

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={() => void onRetry()}
        title={errorMessage ?? "Save failed"}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-danger/10 px-1.5 py-1 text-[10px] font-medium text-danger sm:gap-1.5 sm:px-2 sm:text-[11px]"
      >
        <AlertCircle className="h-3 w-3" />
        <span className="hidden sm:inline">Not saved — retry</span>
      </button>
    );
  }

  const map = {
    idle: { icon: Check, text: "Saved", tone: "text-ink-400" },
    saved: { icon: Check, text: "Saved", tone: "text-pass" },
    saving: { icon: Loader2, text: "Saving…", tone: "text-ink-400" },
    dirty: { icon: Cloud, text: "Unsaved", tone: "text-ink-400" },
  } as const;

  const entry = map[status as keyof typeof map] ?? map.idle;
  const Icon = entry.icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-[10px] font-medium sm:gap-1.5 sm:text-[11px]",
        entry.tone,
        compact && "sm:inline-flex"
      )}
      title={entry.text}
    >
      <Icon className={cn("h-3 w-3", status === "saving" && "animate-spin")} />
      <span className={cn(compact ? "hidden sm:inline" : "hidden md:inline")}>
        {entry.text}
      </span>
    </span>
  );
}

function ExportMenu() {
  const cv = useEditorStore((s) => s.cv);
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);

  const baseName = fileSlug(
    cv.personal.fullName
      ? `${cv.personal.fullName}_${cv.personal.title || "CV"}`
      : cv.name
  );

  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const [{ pdf }, { default: CVDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/cv/CVDocument"),
      ]);
      const blob = await pdf(<CVDocument cv={cv} />).toBlob();
      downloadBlob(blob, `${baseName}.pdf`);
    } catch {
      toast.error("Could not build the PDF. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  };

  const exportDocx = async () => {
    setBusy("docx");
    try {
      const { blob, filename } = await api.downloadDocx({ data: cv });
      downloadBlob(blob, filename || `${baseName}.docx`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not build the DOCX."
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button
        variant="outline"
        size="icon"
        onClick={exportDocx}
        loading={busy === "docx"}
        aria-label="Export DOCX"
        className="sm:hidden"
      >
        <FileText className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportDocx}
        loading={busy === "docx"}
        className="hidden sm:inline-flex"
      >
        DOCX
      </Button>
      <Button
        size="icon"
        onClick={exportPdf}
        loading={busy === "pdf"}
        aria-label="Export PDF"
        className="sm:hidden"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        onClick={exportPdf}
        loading={busy === "pdf"}
        icon={<Download className="h-3.5 w-3.5" />}
        className="hidden sm:inline-flex"
      >
        PDF
      </Button>
    </div>
  );
}
