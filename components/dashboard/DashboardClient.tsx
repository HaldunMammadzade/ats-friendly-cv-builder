"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Copy,
  FilePlus2,
  FileText,
  MoreHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Badge, EmptyState, Modal } from "@/components/ui/Primitives";
import { api, ApiError } from "@/lib/api/client";
import type { ResumeSummary } from "@/lib/api/resumes";
import { cn } from "@/lib/cn";

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function scoreTone(score: number | null) {
  if (score === null) return "neutral" as const;
  if (score >= 85) return "pass" as const;
  if (score >= 65) return "warn" as const;
  return "danger" as const;
}

export default function DashboardClient({
  initialResumes,
}: {
  initialResumes: ResumeSummary[];
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResumeSummary | null>(null);
  const [importState, setImportState] = useState<{
    open: boolean;
    warnings: string[];
    confidence: number;
  }>({ open: false, warnings: [], confidence: 0 });
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () => resumes.filter((r) => r.isArchived === showArchived),
    [resumes, showArchived]
  );

  const archivedCount = resumes.filter((r) => r.isArchived).length;

  const handleError = (error: unknown, fallback: string) => {
    toast.error(error instanceof ApiError ? error.message : fallback);
  };

  const create = async (preset: "empty" | "sample") => {
    setCreating(true);
    try {
      const { resume } = await api.createResume({ preset });
      router.push(`/cv/${resume.id}`);
    } catch (error) {
      handleError(error, "Could not create the CV.");
      setCreating(false);
    }
  };

  const duplicate = async (resume: ResumeSummary) => {
    setBusyId(resume.id);
    try {
      const { resume: copy } = await api.duplicateResume(resume.id);
      setResumes((prev) => [copy, ...prev]);
      toast.success(`Duplicated as "${copy.title}".`);
    } catch (error) {
      handleError(error, "Could not duplicate the CV.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleArchive = async (resume: ResumeSummary) => {
    setBusyId(resume.id);
    const next = !resume.isArchived;
    try {
      await api.updateResume(resume.id, { isArchived: next });
      setResumes((prev) =>
        prev.map((r) => (r.id === resume.id ? { ...r, isArchived: next } : r))
      );
      toast.success(next ? "Moved to archive." : "Restored.");
    } catch (error) {
      handleError(error, "Could not update the CV.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    try {
      await api.deleteResume(target.id);
      setResumes((prev) => prev.filter((r) => r.id !== target.id));
      toast.success(`Deleted "${target.title}".`);
    } catch (error) {
      handleError(error, "Could not delete the CV.");
    } finally {
      setBusyId(null);
    }
  };

  const onImport = async (file: File) => {
    const pending = toast.loading(`Reading ${file.name}…`);
    try {
      const result = await api.importResume(file, true);
      toast.dismiss(pending);

      if (!result.resume) throw new Error("Import returned no CV.");

      setResumes((prev) => [result.resume!, ...prev]);
      setImportState({
        open: true,
        warnings: result.warnings,
        confidence: result.confidence,
      });
      startTransition(() => router.refresh());
    } catch (error) {
      toast.dismiss(pending);
      handleError(error, "Could not read that file.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            Your CVs
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            Keep one tailored version per role you apply to — the ATS score is
            recalculated on every edit.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImport(file);
            }}
          />
          <Button
            variant="outline"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => fileInput.current?.click()}
            className="w-full sm:w-auto"
          >
            Import
          </Button>
          <Button
            variant="outline"
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => void create("sample")}
            disabled={creating}
            className="w-full sm:w-auto"
          >
            Start from example
          </Button>
          <Button
            icon={<FilePlus2 className="h-4 w-4" />}
            onClick={() => void create("empty")}
            loading={creating}
            className="w-full sm:w-auto"
          >
            New CV
          </Button>
        </div>
      </div>

      {archivedCount > 0 && (
        <div className="mt-6 flex items-center gap-1 border-b border-line">
          {[
            { key: false, label: `Active (${resumes.length - archivedCount})` },
            { key: true, label: `Archived (${archivedCount})` },
          ].map((tab) => (
            <button
              key={String(tab.key)}
              type="button"
              onClick={() => setShowArchived(tab.key)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                showArchived === tab.key
                  ? "border-ink-900 text-ink-900"
                  : "border-transparent text-ink-500 hover:text-ink-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {visible.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={showArchived ? "Nothing archived" : "No CVs yet"}
            description={
              showArchived
                ? "Archived CVs stay here until you delete them."
                : "Start from the worked example to see what a high-scoring CV looks like, or import the one you already have."
            }
            action={
              !showArchived && (
                <Button
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={() => void create("sample")}
                  loading={creating}
                >
                  Start from example
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-visible rounded-xl border border-line bg-white shadow-card">
            {visible.map((resume, index) => (
              <li
                key={resume.id}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-3.5 transition-colors hover:bg-ink-50/70 sm:gap-4 sm:px-4",
                  busyId === resume.id && "opacity-50",
                  index === 0 && "rounded-t-xl",
                  index === visible.length - 1 && "rounded-b-xl"
                )}
              >
                <Link
                  href={`/cv/${resume.id}`}
                  className="min-w-0 flex-1 outline-none"
                >
                  <p className="truncate text-sm font-medium text-ink-900">
                    {resume.title}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-500">
                    <span className="hidden sm:inline">
                      {resume.targetRole || "No target role set"} · edited{" "}
                    </span>
                    {relativeTime(resume.updatedAt)}
                  </p>
                </Link>

                <Badge tone={scoreTone(resume.atsScore)} className="shrink-0">
                  <span className="hidden sm:inline">ATS </span>
                  {resume.atsScore ?? "—"}
                </Badge>

                <RowMenu
                  onDuplicate={() => void duplicate(resume)}
                  onArchive={() => void toggleArchive(resume)}
                  onDelete={() => setDeleteTarget(resume)}
                  archived={resume.isArchived}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this CV?"
        description={`"${deleteTarget?.title}" and all of its saved versions will be removed. This cannot be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-600">
          If you only want it out of the way, archive it instead — archived CVs
          keep their version history.
        </p>
      </Modal>

      <Modal
        open={importState.open}
        onClose={() => setImportState((s) => ({ ...s, open: false }))}
        title="Import finished"
        description={`Parsed with ${importState.confidence}% confidence.`}
        footer={
          <Button onClick={() => setImportState((s) => ({ ...s, open: false }))}>
            Got it
          </Button>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-600">
          Extracted text has no structure, so check every field before you send
          this anywhere — dates and company names are the ones that go wrong
          most often.
        </p>
        {importState.warnings.length > 0 && (
          <ul className="mt-4 space-y-2">
            {importState.warnings.map((warning) => (
              <li
                key={warning}
                className="rounded-lg border border-warn/25 bg-warn/5 px-3 py-2 text-[13px] leading-relaxed text-warn"
              >
                {warning}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

function RowMenu({
  onDuplicate,
  onArchive,
  onDelete,
  archived,
}: {
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const close = () => setOpen(false);

  const run = (action: () => void) => {
    close();
    action();
  };

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const width = 176;
      const height = menuRef.current?.offsetHeight ?? 132;
      const margin = 8;

      let top = rect.bottom + 6;
      if (top + height > window.innerHeight - margin) {
        top = rect.top - height - 6;
      }

      let left = rect.right - width;
      if (left < margin) left = margin;
      if (left + width > window.innerWidth - margin) {
        left = window.innerWidth - width - margin;
      }

      setMenuStyle({
        position: "fixed",
        top,
        left,
        width,
        zIndex: 60,
      });
    };

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        style={menuStyle}
        className="animate-scale-in overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop"
        role="menu"
      >
        <MenuItem
          icon={<Copy className="h-3.5 w-3.5" />}
          onClick={() => run(onDuplicate)}
        >
          Duplicate
        </MenuItem>
        <MenuItem
          icon={
            archived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )
          }
          onClick={() => run(onArchive)}
        >
          {archived ? "Restore" : "Archive"}
        </MenuItem>
        <MenuItem
          icon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={() => run(onDelete)}
          danger
        >
          Delete
        </MenuItem>
      </div>,
      document.body
    );

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menu}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors",
        danger
          ? "text-danger hover:bg-danger/5"
          : "text-ink-700 hover:bg-ink-50"
      )}
    >
      <span className="text-ink-400">{icon}</span>
      {children}
    </button>
  );
}
