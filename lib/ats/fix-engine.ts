import "server-only";

import type { CVData } from "@/types/cv";
import { polishEntireCv } from "./fix-content";
import { applySmartQuantification } from "./fix-metrics";
import { enhanceCvWithLlm, enhanceCvHolisticWithLlm } from "./fix-llm";
import type { AtsCheck } from "./score";
import { scoreCV } from "./score";

export interface FixResult {
  applied: boolean;
  message: string;
  mode: "ai" | "engine";
  cv: CVData;
}

const CONTENT_CHECKS = new Set([
  "structure.summary",
  "structure.skills",
  "structure.title",
  "structure.headings",
  "structure.experience",
  "content.actionVerbs",
  "content.quantified",
  "content.weakPhrases",
  "content.pronouns",
  "content.bulletLength",
  "content.bulletsPerRole",
  "content.variety",
  "content.techPerRole",
  "keywords.hardSkills",
  "keywords.softBalance",
  "keywords.titleEcho",
  "keywords.context",
  "format.order",
  "format.characters",
  "format.links",
  "contact.linkedin",
  "contact.location",
  "contact.portfolio",
  "length.empty",
  "length.pages",
  "length.words",
]);

function improved(cv: CVData, next: CVData, check: AtsCheck): boolean {
  const before = scoreCV(cv);
  const after = scoreCV(next);
  const b = before.checks.find((c) => c.id === check.id);
  const a = after.checks.find((c) => c.id === check.id);
  if (a?.status === "pass") return true;
  if (a && b && a.score > b.score + 0.04) return true;
  if (after.score > before.score) return true;
  return JSON.stringify(next) !== JSON.stringify(cv);
}

export async function runAtsFix(cv: CVData, check: AtsCheck): Promise<FixResult> {
  const beforeScore = scoreCV(cv).score;
  let next = structuredClone(cv);
  let mode: FixResult["mode"] = "engine";

  if (
    CONTENT_CHECKS.has(check.id) ||
    check.category === "content" ||
    check.category === "keywords" ||
    check.category === "structure"
  ) {
    const ai = await enhanceCvWithLlm(next, check);
    if (ai) {
      next = ai;
      mode = "ai";
    }
  }

  if (check.id === "content.quantified") {
    next = applySmartQuantification(next, {
      priorityBullets: check.items ?? [],
      targetRatio: 0.5,
    });
  } else {
    next = polishEntireCv(next);
  }

  if (!improved(cv, next, check)) {
    return {
      applied: false,
      mode,
      cv,
      message:
        check.id.startsWith("contact.") &&
        (!cv.personal.email || check.id === "contact.email")
          ? "Add missing contact info manually in Content — it cannot be guessed."
          : "No improvement detected. Set GROQ_API_KEY in .env.local for AI-powered rewrites.",
    };
  }

  const afterScore = scoreCV(next).score;
  return {
    applied: true,
    mode,
    cv: next,
    message:
      mode === "ai"
        ? `AI fixed "${check.label}" — ATS ${beforeScore} → ${afterScore}.`
        : `Fixed "${check.label}" — ATS ${beforeScore} → ${afterScore}.`,
  };
}

export async function runAtsFixAll(cv: CVData): Promise<FixResult> {
  const before = scoreCV(cv);
  const failing = before.checks.filter((c) => c.status !== "pass");
  if (!failing.length) {
    return { applied: false, mode: "engine", cv, message: "All checks already pass." };
  }

  let next = structuredClone(cv);
  let mode: FixResult["mode"] = "engine";

  const holistic = await enhanceCvHolisticWithLlm(next, failing);
  if (holistic) {
    next = holistic;
    mode = "ai";
  } else {
    for (const check of failing.slice(0, 8)) {
      const ai = await enhanceCvWithLlm(next, check);
      if (ai) next = ai;
    }
  }

  next = polishEntireCv(next);
  const after = scoreCV(next);

  if (after.score <= before.score && JSON.stringify(next) === JSON.stringify(cv)) {
    return {
      applied: false,
      mode,
      cv,
      message: "Could not auto-fix remaining issues. Add GROQ_API_KEY for full AI rewrites.",
    };
  }

  return {
    applied: true,
    mode,
    cv: next,
    message: `Optimized ${failing.length} issues — ATS ${before.score} → ${after.score}${mode === "ai" ? " (AI)" : ""}.`,
  };
}
