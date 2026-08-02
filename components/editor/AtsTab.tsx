"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, CircleAlert, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { isAtsAutoFixable } from "@/lib/ats/fixable";
import { useEditorStore } from "@/store/editorStore";
import Button from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/Primitives";
import { cn } from "@/lib/cn";
import type { AtsCheck, CheckStatus } from "@/lib/ats/score";

const STATUS_ICON: Record<CheckStatus, typeof Check> = {
  pass: Check,
  warn: CircleAlert,
  fail: X,
};

const STATUS_STYLE: Record<CheckStatus, string> = {
  pass: "bg-pass/10 text-pass",
  warn: "bg-warn/10 text-warn",
  fail: "bg-danger/10 text-danger",
};

export default function AtsTab() {
  const ats = useEditorStore((s) => s.ats);
  const cv = useEditorStore((s) => s.cv);
  const replace = useEditorStore((s) => s.replace);
  const [filter, setFilter] = useState<"issues" | "all">("issues");
  const [fixingAll, setFixingAll] = useState(false);

  const failing = useMemo(
    () => ats.checks?.filter((c) => c.status !== "pass") ?? [],
    [ats.checks]
  );

  if (!ats.checks) return null;

  const visible = filter === "issues" ? failing : ats.checks;
  const grouped = groupByCategory(visible);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex justify-center sm:justify-start">
            <ScoreRing score={ats.score} size={92} label={`Grade ${ats.grade}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink-900">
              {ats.headline}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
              {failing.length === 0
                ? "Every check passes. Run a job description match next to tune the keywords for a specific posting."
                : `${failing.length} ${failing.length === 1 ? "item needs" : "items need"} attention. Fixing the red ones first moves the score most.`}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {ats.categories.map((category) => {
            const pct = Math.round(category.score);
            return (
              <div key={category.key}>
                <div className="mb-1 flex items-baseline justify-between text-[12px]">
                  <span className="text-ink-600">{category.label}</span>
                  <span className="font-mono text-[11px] text-ink-500">
                    {category.earned.toFixed(1)} / {category.weight}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pct >= 85
                        ? "bg-pass"
                        : pct >= 60
                          ? "bg-warn"
                          : "bg-danger"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <Stat label="Words" value={ats.stats.wordCount} />
          <Stat label="Pages" value={ats.stats.estimatedPages} />
          <Stat label="Bullets" value={ats.stats.bulletCount} />
          <Stat
            label="With numbers"
            value={`${ats.stats.quantifiedBullets}/${ats.stats.bulletCount}`}
          />
          <Stat
            label="Strong verbs"
            value={`${ats.stats.actionVerbBullets}/${ats.stats.bulletCount}`}
          />
          <Stat label="Hard skills" value={ats.stats.hardSkillCount} />
        </dl>
      </div>

      <div className="flex flex-col gap-2 overflow-x-auto sm:flex-row sm:items-center sm:gap-1 rounded-lg bg-ink-100 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ["issues", `Needs work (${failing.length})`],
            ["all", `All checks (${ats.checks.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              filter === key
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-800"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {failing.length > 0 && (
        <Button
          size="sm"
          loading={fixingAll}
          icon={<Wand2 className="h-3.5 w-3.5" />}
          className="w-full"
          onClick={async () => {
            setFixingAll(true);
            try {
              const result = await api.fixAllAtsIssues({ data: cv });
              if (result.applied) {
                replace(result.cv);
                toast.success(result.message);
              } else {
                toast.info(result.message);
              }
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Could not fix all issues."
              );
            } finally {
              setFixingAll(false);
            }
          }}
        >
          Fix all {failing.length} issues automatically
        </Button>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-pass/20 bg-pass/5 px-4 py-6 text-center">
          <Check className="mx-auto h-6 w-6 text-pass" />
          <p className="mt-2 text-[13px] font-medium text-ink-800">
            Nothing left to fix here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([category, checks]) => (
            <div key={category}>
              <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {category}
              </h3>
              <ul className="space-y-1.5">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckRow({ check }: { check: AtsCheck }) {
  const [open, setOpen] = useState(check.status !== "pass");
  const [fixing, setFixing] = useState(false);
  const cv = useEditorStore((s) => s.cv);
  const replace = useEditorStore((s) => s.replace);
  const Icon = STATUS_ICON[check.status];
  const canAutoFix = isAtsAutoFixable(check);
  const expandable = Boolean(check.fix || check.items?.length || canAutoFix);

  const runFix = async () => {
    setFixing(true);
    try {
      const result = await api.fixAtsCheck({ data: cv, check });
      if (result.applied) {
        replace(result.cv);
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not apply fix."
      );
    } finally {
      setFixing(false);
    }
  };

  return (
    <li className="overflow-hidden rounded-lg border border-line bg-white">
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-start gap-2.5 px-3 py-2.5 text-left",
          expandable && "hover:bg-ink-50"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
            STATUS_STYLE[check.status]
          )}
        >
          <Icon className="h-2.5 w-2.5" strokeWidth={3} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-ink-900">
            {check.label}
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">
            {check.message}
          </span>
        </span>

        {expandable && (
          <ChevronDown
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300 transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </button>

      {open && (
        <div className="border-t border-line bg-ink-50/60 px-3 py-2.5">
          {check.fix && (
            <p className="text-[12px] leading-relaxed text-ink-700">
              <span className="font-semibold">How to fix: </span>
              {check.fix}
            </p>
          )}
          {canAutoFix && (
            <Button
              size="sm"
              variant="outline"
              loading={fixing}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              className="mt-2.5"
              onClick={runFix}
            >
              Fix automatically
            </Button>
          )}
          {!canAutoFix && check.status !== "pass" && (
            <p className="mt-2 text-[11px] text-ink-500">
              Add the missing detail in the Content tab — this field cannot be inferred.
            </p>
          )}
          {check.items && check.items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {check.items.map((item, i) => (
                <li
                  key={i}
                  className="rounded border border-line bg-white px-2 py-1 text-[11px] leading-relaxed text-ink-600"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

const CATEGORY_TITLES: Record<string, string> = {
  contact: "Contact details",
  structure: "Structure",
  content: "Content quality",
  keywords: "Keywords",
  formatting: "Formatting & parsing",
  length: "Length",
};

function groupByCategory(checks: AtsCheck[]): [string, AtsCheck[]][] {
  const order = ["contact", "structure", "content", "keywords", "formatting", "length"];
  const map = new Map<string, AtsCheck[]>();

  for (const check of checks) {
    const list = map.get(check.category) ?? [];
    list.push(check);
    map.set(check.category, list);
  }

  return order
    .filter((key) => map.has(key))
    .map((key) => [CATEGORY_TITLES[key] ?? key, map.get(key)!] as [string, AtsCheck[]]);
}
