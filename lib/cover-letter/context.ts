import type { CVData } from "@/types/cv";
import { matchJobDescription, type JobMatchResult } from "@/lib/ats/match";
import { isQuantified, normalize } from "@/lib/ats/text";
import { formatDuration } from "@/lib/cv/format";
import type { Tone } from "./generate";

export interface EvidenceItem {
  text: string;
  role: string;
  company: string;
  jdScore: number;
  quantified: boolean;
  matchedTerms: string[];
}

export interface CoverLetterContext {
  tone: Tone;
  company: string;
  role: string;
  hiringManager?: string;
  candidate: {
    name: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    duration: string;
    summary: string;
    topSkills: string[];
  };
  jobDescription: string;
  match: JobMatchResult | null;
  evidence: EvidenceItem[];
  responsibilities: string[];
  companyPitch: string | null;
  roleMission: string | null;
  matchedKeywords: string[];
  criticalGaps: string[];
  domain: string;
}

export function totalExperienceMonths(cv: CVData): number {
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  let months = 0;

  for (const e of cv.experience) {
    const start = /^(\d{4})-(\d{1,2})$/.exec(e.startDate);
    if (!start) continue;
    const from = Number(start[1]) * 12 + (Number(start[2]) - 1);
    const endMatch = /^(\d{4})-(\d{1,2})$/.exec(e.endDate);
    const to = e.current
      ? current
      : endMatch
        ? Number(endMatch[1]) * 12 + (Number(endMatch[2]) - 1)
        : from;
    months += Math.max(0, to - from);
  }
  return months;
}

function titleCaseWords(text: string): string {
  if (!text || text !== text.toUpperCase()) return text;
  return text.replace(/\b[\p{L}']+\b/gu, (w) =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
}

function bulletOverlapScore(bullet: string, match: JobMatchResult | null): {
  score: number;
  terms: string[];
} {
  if (!match) return { score: 0, terms: [] };
  const blob = normalize(bullet);
  const terms: string[] = [];
  let score = 0;

  for (const hit of match.matched) {
    const needle = normalize(hit.surface);
    if (needle.length < 2) continue;
    if (blob.includes(needle) || blob.includes(normalize(hit.term))) {
      score += hit.importance;
      terms.push(hit.surface);
    }
  }

  return { score, terms: [...new Set(terms)].slice(0, 6) };
}

export function selectEvidence(
  cv: CVData,
  match: JobMatchResult | null,
  limit = 3
): EvidenceItem[] {
  const scored: EvidenceItem[] = [];

  cv.experience.forEach((exp, roleIndex) => {
    for (const bullet of exp.bullets) {
      const text = bullet.trim();
      if (text.length < 30) continue;

      const { score: jdScore, terms } = bulletOverlapScore(text, match);
      let score = jdScore;
      if (isQuantified(text)) score += 8;
      if (roleIndex === 0) score += 5;
      else if (roleIndex === 1) score += 2;
      score += Math.min(3, Math.floor(text.length / 100));

      scored.push({
        text,
        role: exp.role,
        company: exp.company,
        jdScore: score,
        quantified: isQuantified(text),
        matchedTerms: terms,
      });
    }
  });

  for (const project of cv.projects) {
    for (const bullet of project.bullets) {
      const text = bullet.trim();
      if (text.length < 30) continue;
      const { score: jdScore, terms } = bulletOverlapScore(text, match);
      scored.push({
        text,
        role: project.role || "Project",
        company: project.name,
        jdScore: jdScore + (isQuantified(text) ? 4 : 1),
        quantified: isQuantified(text),
        matchedTerms: terms,
      });
    }
  }

  return scored
    .sort((a, b) => b.jdScore - a.jdScore)
    .slice(0, limit);
}

const RESPONSIBILITY_VERBS =
  /^(design|build|develop|lead|manage|drive|implement|collaborate|work|create|maintain|optimi|architect|deliver|support|own|spearhead|mentor|coordinate|integrate|ship|scale|improve|ensure|contribute|partner|research|write|test|deploy)/i;

export function extractResponsibilities(jd: string): string[] {
  const lines = jd
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•▪◦‣·*\-–—]+\s*/, "").trim())
    .filter((l) => l.length > 25 && l.length < 220);

  const out: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(about|who we|requirements|qualifications|benefits|what you|nice to have)/.test(lower)) {
      continue;
    }
    if (RESPONSIBILITY_VERBS.test(line) || /^you (will|ll|are)/i.test(line)) {
      out.push(line.replace(/^you (will|ll|are expected to)\s+/i, ""));
    }
  }

  return [...new Set(out)].slice(0, 6);
}

export function extractCompanyPitch(jd: string): string | null {
  const lines = jd
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (/^(about us|who we are|about the company|our mission|the company)/.test(lower)) {
      const next = lines[i + 1];
      if (next && next.length > 30) return trimSentence(next, 180);
    }
    if (/^we (are|build|help|make|re|develop|create)/.test(lower) && lines[i].length > 45) {
      return trimSentence(lines[i], 180);
    }
  }
  return null;
}

export function extractRoleMission(jd: string): string | null {
  const lines = jd
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (/^(the role|about the role|role overview|position overview|what you.ll do)/.test(lower)) {
      const next = lines[i + 1];
      if (next && next.length > 30) return trimSentence(next, 160);
    }
    if (/^as a (senior )?/.test(lower) && lines[i].length > 40) {
      return trimSentence(lines[i], 160);
    }
  }
  return null;
}

function trimSentence(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-–—]+$/, "")}…`;
}

function domainPhrase(cv: CVData, match: JobMatchResult | null): string {
  const fromMatch = match?.matched.slice(0, 3).map((k) => k.surface) ?? [];
  if (fromMatch.length >= 2) return listPhrase(fromMatch);

  const skills = cv.skills.flatMap((g) => g.items).slice(0, 4);
  if (skills.length >= 2) return listPhrase(skills);

  return cv.personal.title || "production software";
}

function listPhrase(items: string[]): string {
  const clean = items.filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

export function buildCoverLetterContext(input: {
  cv: CVData;
  company?: string;
  role?: string;
  hiringManager?: string;
  jobDescription?: string;
  tone?: Tone;
}): CoverLetterContext {
  const { cv } = input;
  const tone = input.tone ?? "professional";
  const company = (input.company || cv.meta.targetCompany || "your company").trim();
  const role = (
    input.role ||
    cv.meta.targetRole ||
    cv.personal.title ||
    "this role"
  ).trim();
  const jobDescription = (input.jobDescription || cv.meta.jobDescription || "").trim();
  const match = jobDescription.length > 60 ? matchJobDescription(cv, jobDescription) : null;

  const months = totalExperienceMonths(cv);
  const duration = months ? formatDuration(months) : "";

  return {
    tone,
    company,
    role,
    hiringManager: input.hiringManager?.trim() || undefined,
    candidate: {
      name: titleCaseWords(cv.personal.fullName.trim()),
      title: titleCaseWords(cv.personal.title.trim()),
      location: cv.personal.location.trim(),
      email: cv.personal.email.trim(),
      phone: cv.personal.phone.trim(),
      duration,
      summary: cv.summary.trim(),
      topSkills: cv.skills.flatMap((g) => g.items).slice(0, 8),
    },
    jobDescription,
    match,
    evidence: selectEvidence(cv, match, 3),
    responsibilities: extractResponsibilities(jobDescription),
    companyPitch: extractCompanyPitch(jobDescription),
    roleMission: extractRoleMission(jobDescription),
    matchedKeywords: match
      ? match.matched.slice(0, 8).map((k) => k.surface)
      : cv.skills.flatMap((g) => g.items).slice(0, 6),
    criticalGaps: match
      ? match.criticalMissing.slice(0, 3).map((k) => k.surface)
      : [],
    domain: domainPhrase(cv, match),
  };
}

/** Structured facts for LLM prompts — nothing invented beyond this object. */
export function contextToFacts(ctx: CoverLetterContext): Record<string, unknown> {
  return {
    candidate: ctx.candidate,
    target: {
      company: ctx.company,
      role: ctx.role,
      hiringManager: ctx.hiringManager ?? null,
      tone: ctx.tone,
    },
    matchScore: ctx.match?.score ?? null,
    matchedKeywords: ctx.matchedKeywords,
    criticalGaps: ctx.criticalGaps,
    responsibilities: ctx.responsibilities,
    companyPitch: ctx.companyPitch,
    roleMission: ctx.roleMission,
    evidence: ctx.evidence.map((e) => ({
      role: e.role,
      company: e.company,
      achievement: e.text,
      matchedTerms: e.matchedTerms,
    })),
  };
}

export { listPhrase };
