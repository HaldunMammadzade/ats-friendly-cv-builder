"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  Mail,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, downloadBlob } from "@/lib/api/client";
import type { CoverLetterRow } from "@/types/database";
import type { ResumeSummary } from "@/lib/api/resumes";
import Button from "@/components/ui/Button";
import { SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { Badge, EmptyState, Modal } from "@/components/ui/Primitives";
import { cn } from "@/lib/cn";
import { fileSlug } from "@/lib/cv/format";

type Tone = "professional" | "friendly" | "direct" | "enthusiastic";

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

export default function CoverLettersClient({
  initialLetters,
  resumes,
}: {
  initialLetters: CoverLetterRow[];
  resumes: ResumeSummary[];
}) {
  const [letters, setLetters] = useState(initialLetters);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLetters[0]?.id ?? null
  );
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [deleting, setDeleting] = useState<CoverLetterRow | null>(null);

  const selected = letters.find((l) => l.id === selectedId) ?? null;

  const upsert = useCallback((letter: CoverLetterRow) => {
    setLetters((prev) => {
      const index = prev.findIndex((l) => l.id === letter.id);
      if (index === -1) return [letter, ...prev];
      const next = [...prev];
      next[index] = letter;
      return next;
    });
  }, []);

  const remove = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await api.deleteCoverLetter(target.id);
      setLetters((prev) => prev.filter((l) => l.id !== target.id));
      if (selectedId === target.id) setSelectedId(null);
      toast.success("Cover letter deleted");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not delete."
      );
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] min-h-0 max-w-[1400px] flex-col md:flex-row">
      {/* Mobile letter picker */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-3 py-2.5 md:hidden">
        <label className="sr-only" htmlFor="cover-letter-select">
          Select cover letter
        </label>
        <select
          id="cover-letter-select"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-900 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
        >
          {letters.length === 0 ? (
            <option value="">No letters yet</option>
          ) : (
            letters.map((letter) => (
              <option key={letter.id} value={letter.id}>
                {letter.title || "Untitled"}
              </option>
            ))
          )}
        </select>
        <Button
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setGeneratorOpen(true)}
        >
          New
        </Button>
      </div>

      <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h1 className="text-sm font-semibold text-ink-900">Cover letters</h1>
          <Button
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setGeneratorOpen(true)}
          >
            New
          </Button>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {letters.map((letter) => (
            <li key={letter.id}>
              <button
                type="button"
                onClick={() => setSelectedId(letter.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                  selectedId === letter.id
                    ? "bg-ink-100"
                    : "hover:bg-ink-50"
                )}
              >
                <span className="block truncate text-[13px] font-medium text-ink-900">
                  {letter.title || "Untitled"}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-500">
                  {[letter.role, letter.company].filter(Boolean).join(" · ") ||
                    "No target set"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <LetterEditor
            key={selected.id}
            letter={selected}
            resumes={resumes}
            onSaved={upsert}
            onDelete={() => setDeleting(selected)}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              icon={<Mail className="h-8 w-8" />}
              title="No cover letter selected"
              description="Generate a first draft from one of your CVs and the job posting. It pulls your strongest quantified achievements and the posting's own vocabulary."
              action={
                <Button
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={() => setGeneratorOpen(true)}
                >
                  Generate a draft
                </Button>
              }
            />
          </div>
        )}
      </main>

      <GeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        resumes={resumes}
        onCreated={(letter) => {
          upsert(letter);
          setSelectedId(letter.id);
          setGeneratorOpen(false);
        }}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this cover letter?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-600">
          “{deleting?.title}” will be removed permanently.
        </p>
      </Modal>
    </div>
  );
}

type LetterDraftFields = Pick<
  CoverLetterRow,
  "title" | "company" | "role" | "body" | "tone" | "resume_id"
>;

function draftSnapshot(draft: LetterDraftFields): string {
  return JSON.stringify({
    title: draft.title,
    company: draft.company,
    role: draft.role,
    body: draft.body,
    tone: draft.tone,
    resumeId: draft.resume_id,
  });
}

function LetterEditor({
  letter,
  resumes,
  onSaved,
  onDelete,
}: {
  letter: CoverLetterRow;
  resumes: ResumeSummary[];
  onSaved: (letter: CoverLetterRow) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(letter);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(draftSnapshot(letter));
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const wordCount = useMemo(
    () => (draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0),
    [draft.body]
  );

  useEffect(() => {
    const snapshot = draftSnapshot(draft);
    if (snapshot === lastSaved.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const { coverLetter } = await api.updateCoverLetter(draft.id, {
          title: draft.title,
          company: draft.company,
          role: draft.role,
          body: draft.body,
          tone: draft.tone as Tone,
          resumeId: draft.resume_id,
        });
        lastSaved.current = draftSnapshot(coverLetter);
        onSavedRef.current(coverLetter);
      } catch {
        toast.error("Could not save the cover letter.");
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft]);

  const download = () => {
    const blob = new Blob([draft.body], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob(blob, `${fileSlug(draft.title || "Cover_Letter")}.txt`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-5 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          aria-label="Cover letter title"
          className="min-w-0 w-full rounded-lg border border-transparent px-2 py-1 text-lg font-semibold text-ink-900 transition-colors hover:border-line focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10 sm:flex-1"
        />
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {saving && (
            <span className="text-[11px] text-ink-400">Saving…</span>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => {
              void navigator.clipboard.writeText(draft.body);
              toast.success("Copied to clipboard");
            }}
          >
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={download}
            aria-label="Download as text file"
          >
            <span className="hidden min-[400px]:inline">.txt</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TextInput
          label="Role"
          value={draft.role}
          onChange={(e) => setDraft({ ...draft, role: e.target.value })}
        />
        <TextInput
          label="Company"
          value={draft.company}
          onChange={(e) => setDraft({ ...draft, company: e.target.value })}
        />
        <SelectInput
          label="Linked CV"
          value={draft.resume_id ?? ""}
          onChange={(e) =>
            setDraft({ ...draft, resume_id: e.target.value || null })
          }
          options={[
            { value: "", label: "None" },
            ...resumes.map((r) => ({ value: r.id, label: r.title })),
          ]}
        />
      </div>

      <div className="mt-4">
        <TextArea
          label="Letter"
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          rows={22}
          className="font-serif text-[14px] leading-[1.7]"
          action={
            <Badge tone={wordCount > 400 ? "warn" : "neutral"}>
              {wordCount} words
            </Badge>
          }
          hint="Aim for 250–350 words across three or four short paragraphs. Anything longer rarely gets read."
        />
      </div>
    </div>
  );
}

function GeneratorModal({
  open,
  onClose,
  resumes,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  resumes: ResumeSummary[];
  onCreated: (letter: CoverLetterRow) => void;
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [useAi, setUseAi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{
    quality: number;
    matchScore: number | null;
    mode: string;
    notes: string[];
  } | null>(null);

  const generate = async () => {
    if (!resumeId) {
      toast.error("Create a CV first — the letter is built from its content.");
      return;
    }

    setBusy(true);
    try {
      const { draft } = await api.generateCoverLetter({
        resumeId,
        company,
        role,
        hiringManager,
        jobDescription,
        tone,
        useAi,
      });

      setPreview({
        quality: draft.quality.score,
        matchScore: draft.quality.matchScore,
        mode: draft.mode,
        notes: draft.notes,
      });

      const { coverLetter } = await api.createCoverLetter({
        title:
          [role, company].filter(Boolean).join(" — ") || "New cover letter",
        company,
        role,
        body: draft.body,
        tone,
        resumeId,
      });

      onCreated(coverLetter);
      if (draft.mode === "ai") {
        toast.success(`AI draft ready — quality ${draft.quality.score}/100`);
      } else if (draft.notes.length) {
        toast.success(`Draft ready — quality ${draft.quality.score}/100`);
      } else {
        toast.success("Draft ready — edit before sending");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not generate."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate a cover letter"
      description="Tailors your strongest quantified achievements to the posting's language. Paste the full job description for best results."
      width="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={generate}
            loading={busy}
            icon={<Sparkles className="h-4 w-4" />}
          >
            Generate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectInput
          label="Base CV"
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
          options={
            resumes.length
              ? resumes.map((r) => ({ value: r.id, label: r.title }))
              : [{ value: "", label: "No CVs yet" }]
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Senior Frontend Engineer"
          />
          <TextInput
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme"
          />
          <TextInput
            label="Hiring manager"
            value={hiringManager}
            onChange={(e) => setHiringManager(e.target.value)}
            placeholder="Optional"
            hint="A name beats “Dear Hiring Manager” when you can find one."
          />
          <SelectInput
            label="Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            options={TONES}
          />
        </div>

        <TextArea
          label="Job description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
          placeholder="Paste the full posting — responsibilities, requirements, and about-the-company sections all help."
          hint="Required for a tailored letter. Without it, the draft stays generic."
        />

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-ink-50/50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={useAi}
            onChange={(e) => setUseAi(e.target.checked)}
            className="mt-0.5 rounded border-line text-brand-600 focus:ring-brand-600"
          />
          <span className="text-[13px] leading-relaxed text-ink-700">
            <span className="font-medium text-ink-900">AI enhance</span> — polish
            the draft with Groq (Llama 3.3) when{" "}
            <code className="rounded bg-ink-100 px-1 font-mono text-[11px]">
              GROQ_API_KEY
            </code>{" "}
            is set. Uses only facts from your CV.
          </span>
        </label>

        {preview && (
          <div className="rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] text-ink-600">
            <p className="font-medium text-ink-800">
              Last draft: {preview.quality}/100 quality
              {preview.matchScore != null && ` · ${preview.matchScore}% CV match`}
              {preview.mode === "ai" && " · AI enhanced"}
            </p>
            {preview.notes.slice(0, 2).map((note) => (
              <p key={note} className="mt-1 leading-relaxed">
                {note}
              </p>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
