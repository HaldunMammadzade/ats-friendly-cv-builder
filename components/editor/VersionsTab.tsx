"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { useEditorStore } from "@/store/editorStore";
import Button from "@/components/ui/Button";
import { Badge, EmptyState, Modal } from "@/components/ui/Primitives";
import { TextInput } from "@/components/ui/Field";

interface VersionRow {
  id: string;
  version: number;
  label: string;
  atsScore: number | null;
  createdAt: string;
}

export default function VersionsTab({ saveNow }: { saveNow: () => Promise<void> }) {
  const resumeId = useEditorStore((s) => s.resumeId);
  const initialize = useEditorStore((s) => s.initialize);

  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<VersionRow | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);

  const load = useCallback(async () => {
    if (!resumeId) return;
    try {
      const { versions } = await api.listVersions(resumeId);
      setVersions(versions);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not load versions."
      );
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!resumeId) return;
      try {
        const { versions } = await api.listVersions(resumeId);
        if (!cancelled) setVersions(versions);
      } catch {
        if (!cancelled) toast.error("Could not load the version history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  const createSnapshot = async () => {
    setSaving(true);
    try {
      await saveNow();
      await api.createVersion(resumeId, label.trim() || "Manual save point");
      setLabel("");
      await load();
      toast.success("Restore point saved");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not save a version."
      );
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    if (!restoring) return;
    setRestoreBusy(true);
    try {
      const { resume } = await api.restoreVersion(resumeId, restoring.id);
      initialize(resume.id, resume.data);
      await load();
      toast.success(`Restored version ${restoring.version}`);
      setRestoring(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not restore."
      );
    } finally {
      setRestoreBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-white p-4">
        <h3 className="text-[13px] font-semibold text-ink-900">
          Save a restore point
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
          Do this before tailoring the CV to a specific posting, so you can get
          the general version back in one click. The 30 newest are kept.
        </p>
        <div className="mt-3 flex items-end gap-2">
          <TextInput
            wrapperClassName="flex-1"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Before tailoring for Vercel"
          />
          <Button
            onClick={createSnapshot}
            loading={saving}
            icon={<Save className="h-4 w-4" />}
          >
            Save
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-line bg-ink-50"
            />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <EmptyState
          icon={<History className="h-7 w-7" />}
          title="No versions yet"
          description="A restore point is captured automatically the first time you edit in a session."
        />
      ) : (
        <ul className="space-y-1.5">
          {versions.map((version, index) => (
            <li
              key={version.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-ink-900">
                    {version.label || `Version ${version.version}`}
                  </span>
                  {index === 0 && <Badge tone="brand">Latest</Badge>}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  v{version.version} · {formatWhen(version.createdAt)}
                  {version.atsScore !== null && ` · ATS ${version.atsScore}`}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => setRestoring(version)}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(restoring)}
        onClose={() => setRestoring(null)}
        title={`Restore version ${restoring?.version ?? ""}?`}
        description="Your current draft is saved as a new restore point first, so nothing is lost either way."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRestoring(null)}>
              Cancel
            </Button>
            <Button onClick={restore} loading={restoreBusy}>
              Restore
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-600">
          The editor will reload with the content as it was on{" "}
          {restoring && formatWhen(restoring.createdAt)}.
        </p>
      </Modal>
    </div>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)} d ago`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
