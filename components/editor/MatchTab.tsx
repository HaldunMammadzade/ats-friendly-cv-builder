"use client";

import { useState } from "react";
import { Plus, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editorStore";
import { TextArea, TextInput } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge, ScoreRing } from "@/components/ui/Primitives";
import { SectionShell } from "./parts";
import { cn } from "@/lib/cn";
import type { KeywordHit } from "@/lib/ats/match";
import { emptySkillGroup } from "@/lib/cv/defaults";

export default function MatchTab() {
  const meta = useEditorStore((s) => s.cv.meta);
  const match = useEditorStore((s) => s.jobMatch);
  const mutate = useEditorStore((s) => s.mutate);
  const runJobMatch = useEditorStore((s) => s.runJobMatch);
  const clearJobMatch = useEditorStore((s) => s.clearJobMatch);

  const [busy, setBusy] = useState(false);

  const analyze = () => {
    setBusy(true);
    const result = runJobMatch(meta.jobDescription);
    setBusy(false);
    if (!result) {
      toast.error("Paste a longer job description — at least a few sentences.");
    }
  };

  return (
    <div className="space-y-3">
      <SectionShell
        title="Target role"
        description="Paste the posting once. Every keyword below is pulled straight out of it and weighted by how often and where it appears."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Role"
            value={meta.targetRole}
            onChange={(e) =>
              mutate((d) => {
                d.meta.targetRole = e.target.value;
              })
            }
            placeholder="Senior Frontend Engineer"
          />
          <TextInput
            label="Company"
            value={meta.targetCompany}
            onChange={(e) =>
              mutate((d) => {
                d.meta.targetCompany = e.target.value;
              })
            }
            placeholder="Acme"
          />
        </div>

        <div className="mt-4">
          <TextArea
            label="Job description"
            value={meta.jobDescription}
            onChange={(e) =>
              mutate((d) => {
                d.meta.jobDescription = e.target.value;
              })
            }
            rows={10}
            placeholder="Paste the full posting here, including the requirements and nice-to-have sections…"
            hint="Nothing leaves your account — the matching runs against your own data."
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={analyze}
            loading={busy}
            icon={<Target className="h-4 w-4" />}
            disabled={meta.jobDescription.trim().length < 40}
          >
            Match against this posting
          </Button>
          {match && (
            <Button variant="ghost" onClick={clearJobMatch}>
              Clear
            </Button>
          )}
        </div>
      </SectionShell>

      {match && (
        <>
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={match.score} size={92} label="Match" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-900">
                  {match.headline}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                  {match.matched.length} of {match.totalKeywords} keywords from
                  the posting appear in your CV
                  {match.criticalMissing.length > 0 && (
                    <>
                      , and {match.criticalMissing.length} stated requirement
                      {match.criticalMissing.length === 1 ? " is" : "s are"}{" "}
                      missing
                    </>
                  )}
                  .
                </p>
              </div>
            </div>
          </div>

          {match.criticalMissing.length > 0 && (
            <KeywordPanel
              title="Missing requirements"
              tone="danger"
              description="The posting frames these as must-haves. If you have the experience, name it in a bullet using the posting's exact wording."
              keywords={match.criticalMissing}
            />
          )}

          {match.missing.length > 0 && (
            <KeywordPanel
              title="Missing keywords"
              tone="warn"
              description="Ranked by how much weight the posting puts on them. Add only what you can genuinely back up."
              keywords={match.missing.filter(
                (k) => !match.criticalMissing.some((c) => c.term === k.term)
              )}
            />
          )}

          <KeywordPanel
            title="Already covered"
            tone="pass"
            description="Found in your CV. Terms matched in a dated role count for more than terms sitting only in the skills list."
            keywords={match.matched}
            collapsed
          />

          {match.suggestions.length > 0 && (
            <SectionShell
              title="Bullet starters"
              description="Skeletons using the posting's own vocabulary. Fill in the numbers — an unquantified bullet still loses points."
            >
              <ul className="space-y-2">
                {match.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-line bg-ink-50/60 px-3 py-2.5"
                  >
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                    <span className="flex-1 text-[12px] leading-relaxed text-ink-700">
                      {suggestion}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(suggestion);
                        toast.success("Copied");
                      }}
                      className="shrink-0 text-[11px] font-medium text-brand-700 hover:underline"
                    >
                      Copy
                    </button>
                  </li>
                ))}
              </ul>
            </SectionShell>
          )}
        </>
      )}
    </div>
  );
}

function KeywordPanel({
  title,
  description,
  keywords,
  tone,
  collapsed = false,
}: {
  title: string;
  description: string;
  keywords: KeywordHit[];
  tone: "pass" | "warn" | "danger";
  collapsed?: boolean;
}) {
  const mutate = useEditorStore((s) => s.mutate);
  if (keywords.length === 0) return null;

  const addSkill = (keyword: KeywordHit) => {
    mutate((d) => {
      const group =
        d.skills.find((g) => /skill|tool|tech|core/i.test(g.category)) ??
        d.skills[0];

      if (group) {
        if (
          !group.items.some(
            (i) => i.toLowerCase() === keyword.surface.toLowerCase()
          )
        ) {
          group.items.push(keyword.surface);
        }
      } else {
        const created = emptySkillGroup("Core Skills");
        created.items.push(keyword.surface);
        d.skills.push(created);
      }
    });
    toast.success(`Added “${keyword.surface}” to your skills`);
  };

  return (
    <SectionShell
      title={title}
      count={keywords.length}
      description={description}
      defaultOpen={!collapsed}
    >
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((keyword) => (
          <span
            key={keyword.term}
            className={cn(
              "group inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]",
              tone === "pass" && "border-pass/20 bg-pass/5 text-ink-800",
              tone === "warn" && "border-warn/25 bg-warn/5 text-ink-800",
              tone === "danger" && "border-danger/25 bg-danger/5 text-ink-800"
            )}
            title={`Mentioned ${keyword.occurrences}× in the posting`}
          >
            {keyword.surface}
            {keyword.importance >= 7 && (
              <Badge tone="neutral" className="px-1 py-0 text-[9px]">
                key
              </Badge>
            )}
            {tone !== "pass" && (
              <button
                type="button"
                onClick={() => addSkill(keyword)}
                aria-label={`Add ${keyword.surface} to skills`}
                title="Add to skills"
                className="rounded p-0.5 text-ink-400 opacity-0 transition-opacity hover:bg-ink-100 hover:text-ink-800 focus:opacity-100 group-hover:opacity-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}
