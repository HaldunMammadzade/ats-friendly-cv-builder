import type { CVData } from "@/types/cv";
import { buildCoverLetterContext } from "./context";
import { composeCoverLetter } from "./compose";

export type Tone = "professional" | "friendly" | "direct" | "enthusiastic";

export interface CoverLetterInput {
  cv: CVData;
  company?: string;
  role?: string;
  jobDescription?: string;
  hiringManager?: string;
  tone?: Tone;
  /** When true and GROQ_API_KEY is set, polish the draft with an LLM. */
  useAi?: boolean;
}

export interface CoverLetterDraft {
  body: string;
  wordCount: number;
  usedKeywords: string[];
  notes: string[];
  quality: {
    score: number;
    matchScore: number | null;
    evidenceCount: number;
    hasJobDescription: boolean;
  };
  mode: "deterministic" | "ai";
}

function scoreDraft(body: string, ctx: ReturnType<typeof buildCoverLetterContext>): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  let score = 35;

  if (ctx.jobDescription.length > 60) score += 15;
  if (ctx.match) score += Math.round(ctx.match.score * 0.25);
  if (ctx.evidence.length >= 2) score += 12;
  if (ctx.evidence.some((e) => e.quantified)) score += 8;
  if (words >= 250 && words <= 380) score += 10;
  if (!/\[[^\]]+\]/.test(body)) score += 10;
  if (ctx.matchedKeywords.length >= 4) score += 5;

  return Math.min(100, Math.round(score));
}

function buildNotes(
  ctx: ReturnType<typeof buildCoverLetterContext>,
  mode: CoverLetterDraft["mode"]
): string[] {
  const notes: string[] = [];

  if (!ctx.jobDescription) {
    notes.push(
      "Paste the full job description to tailor keywords and responsibilities — generic letters underperform."
    );
  } else if (ctx.match && ctx.match.score < 50) {
    notes.push(
      `CV–posting match is ${ctx.match.score}%. Consider adjusting your CV skills or summary before sending.`
    );
  }

  if (ctx.criticalGaps.length) {
    notes.push(
      `The posting expects ${ctx.criticalGaps.join(", ")} — address these honestly or add them to your CV if true.`
    );
  }

  if (!ctx.evidence.length) {
    notes.push(
      "Add quantified achievement bullets to your CV — the generator pulls proof from there."
    );
  }

  if (mode === "deterministic" && ctx.jobDescription.length > 60) {
    notes.push(
      "Tip: add GROQ_API_KEY to .env.local for AI-polished letters (uses your CV facts only)."
    );
  }

  if (mode === "ai") {
    notes.push("AI-enhanced draft — verify every claim against your CV before sending.");
  }

  return notes;
}

export async function generateCoverLetter(
  input: CoverLetterInput
): Promise<CoverLetterDraft> {
  const ctx = buildCoverLetterContext(input);
  const baseline = composeCoverLetter(ctx);

  const wantsAi = input.useAi !== false;
  let aiBody: string | null = null;
  if (wantsAi && ctx.jobDescription.length > 60) {
    const { enhanceCoverLetterWithLlm } = await import("./llm");
    aiBody = await enhanceCoverLetterWithLlm(ctx, baseline);
  }

  const body = aiBody ?? baseline;
  const mode: CoverLetterDraft["mode"] = aiBody ? "ai" : "deterministic";
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const notes = buildNotes(ctx, mode);

  if (wordCount > 400) {
    notes.unshift(
      `Draft is ${wordCount} words — trim to 250–350 for recruiter skim speed.`
    );
  }

  return {
    body,
    wordCount,
    usedKeywords: ctx.matchedKeywords,
    notes,
    quality: {
      score: scoreDraft(body, ctx),
      matchScore: ctx.match?.score ?? null,
      evidenceCount: ctx.evidence.length,
      hasJobDescription: ctx.jobDescription.length > 60,
    },
    mode,
  };
}
