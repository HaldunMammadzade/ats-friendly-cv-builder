import type { CVData } from "@/types/cv";
import { ALIAS_TO_CANONICAL, SOFT_SKILLS, STOP_WORDS } from "./dictionary";
import {
  buildTextIndex,
  canonicalize,
  indexContains,
  ngrams,
  normalize,
} from "./text";

export interface KeywordHit {
  /** Canonical form used for comparison. */
  term: string;
  /** How it was written in the posting, for display. */
  surface: string;
  /** 1–10, higher means the posting leans on it more. */
  importance: number;
  occurrences: number;
  /** True when the posting frames it as a hard requirement. */
  required: boolean;
  /** Which resume section it was found in, when matched. */
  foundIn?: "skills" | "experience" | "summary" | "projects" | "other";
}

export interface JobMatchResult {
  score: number;
  matched: KeywordHit[];
  missing: KeywordHit[];
  /** Missing terms the posting marks as required — fix these first. */
  criticalMissing: KeywordHit[];
  totalKeywords: number;
  headline: string;
  /** Ready-to-paste bullet starters for the top missing keywords. */
  suggestions: string[];
  generatedAt: number;
}

/** Lines under these headings describe hard requirements. */
const REQUIREMENT_MARKERS = [
  "requirement",
  "qualification",
  "must have",
  "must-have",
  "you have",
  "you will need",
  "what you bring",
  "essential",
  "minimum",
  "required",
];

const NICE_TO_HAVE_MARKERS = [
  "nice to have",
  "nice-to-have",
  "bonus",
  "plus",
  "preferred",
  "desirable",
  "advantage",
];

/** Frequent in postings but meaningless as a resume keyword. */
const GENERIC_TERMS = new Set([
  "strong", "good", "great", "excellent", "solid", "proven", "track", "record",
  "understanding", "knowledge", "hands", "hands-on", "passionate", "highly",
  "fast", "paced", "world", "class", "cutting", "edge", "state", "art",
  "self", "detail", "oriented", "closely", "across", "including", "such",
  "etc", "e.g", "i.e", "able", "willing", "ideally", "familiarity",
  "demonstrable", "relevant", "similar", "equivalent", "degree", "field",
  "related", "plus", "bonus", "least", "level", "senior", "junior", "mid",
  "full", "time", "part", "remote", "hybrid", "onsite", "office", "week",
  "day", "month", "year", "annual", "competitive", "package", "insurance",
  "holiday", "vacation", "pension", "bonus", "stock", "equity", "visa",
  "sponsorship", "diverse", "inclusive", "inclusion", "diversity", "gender",
  "race", "religion", "orientation", "disability", "veteran", "status",
  "regard", "without", "employment", "opportunity", "committed", "encourage",
  "application", "applications", "process", "interview", "stage", "recruiter",
  "hiring", "manager", "please", "note", "successful", "join", "growing",
  "exciting", "amazing", "awesome", "love", "want", "need", "help", "make",
  "build", "work", "working", "ensure", "deliver", "drive", "support",
  "provide", "maintain", "develop", "create", "manage", "lead", "collaborate",
]);

interface RawKeyword {
  term: string;
  surface: string;
  occurrences: number;
  required: boolean;
  known: boolean;
}

/** Splits the posting into lines tagged by the requirement context above them. */
function classifyLines(jd: string): { text: string; required: boolean; optional: boolean }[] {
  const lines = jd
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let required = false;
  let optional = false;
  const out: { text: string; required: boolean; optional: boolean }[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isHeading = line.length < 80 && !/[.!?]$/.test(line);

    if (isHeading) {
      if (REQUIREMENT_MARKERS.some((m) => lower.includes(m))) {
        required = true;
        optional = false;
      } else if (NICE_TO_HAVE_MARKERS.some((m) => lower.includes(m))) {
        required = false;
        optional = true;
      }
    }

    const inlineRequired =
      /\b(must|required|require|essential|minimum)\b/.test(lower);
    const inlineOptional = NICE_TO_HAVE_MARKERS.some((m) => lower.includes(m));

    out.push({
      text: line,
      required: (required || inlineRequired) && !inlineOptional,
      optional: optional || inlineOptional,
    });
  }

  return out;
}

function extractKeywords(jd: string): RawKeyword[] {
  const lines = classifyLines(jd);
  const found = new Map<string, RawKeyword>();

  const record = (
    canonical: string,
    surface: string,
    required: boolean,
    known: boolean
  ) => {
    const existing = found.get(canonical);
    if (existing) {
      existing.occurrences += 1;
      existing.required = existing.required || required;
      existing.known = existing.known || known;
      return;
    }
    found.set(canonical, {
      term: canonical,
      surface,
      occurrences: 1,
      required,
      known,
    });
  };

  for (const line of lines) {
    const tokens = normalize(line.text).split(" ").filter(Boolean);
    if (!tokens.length) continue;

    // Multi-word terms first so their parts aren't also counted alone.
    const consumed = new Set<number>();

    for (const size of [3, 2] as const) {
      const grams = ngrams(tokens, size);
      grams.forEach((gram, i) => {
        const canonical = ALIAS_TO_CANONICAL.get(gram);
        if (canonical) {
          record(canonical, gram, line.required, true);
          for (let k = 0; k < size; k++) consumed.add(i + k);
          return;
        }
        if (SOFT_SKILLS.has(gram)) {
          record(gram, gram, line.required, true);
          for (let k = 0; k < size; k++) consumed.add(i + k);
          return;
        }
        const parts = gram.split(" ");
        const meaningful = parts.every(
          (p) => p.length > 2 && !STOP_WORDS.has(p) && !GENERIC_TERMS.has(p)
        );
        if (meaningful && size === 2) {
          record(gram, gram, line.required, false);
        }
      });
    }

    tokens.forEach((token, i) => {
      if (consumed.has(i)) return;
      const canonical = ALIAS_TO_CANONICAL.get(token);
      if (canonical) {
        record(canonical, token, line.required, true);
        return;
      }
      if (
        token.length > 2 &&
        !STOP_WORDS.has(token) &&
        !GENERIC_TERMS.has(token) &&
        !/^\d+$/.test(token)
      ) {
        record(token, token, line.required, false);
      }
    });
  }

  return [...found.values()];
}

function importanceOf(kw: RawKeyword): number {
  let score = 1;
  score += Math.min(4, kw.occurrences - 1);
  if (kw.known) score += 3;
  if (kw.required) score += 3;
  if (kw.term.includes(" ")) score += 1;
  return Math.min(10, score);
}

function locate(cv: CVData, term: string): KeywordHit["foundIn"] {
  const needle = normalize(term);
  const inList = (values: string[]) =>
    values.some((v) => normalize(v).includes(needle));

  if (inList(cv.skills.flatMap((g) => [g.category, ...g.items]))) return "skills";
  if (
    inList(
      cv.experience.flatMap((e) => [e.role, e.company, ...e.tech, ...e.bullets])
    )
  ) {
    return "experience";
  }
  if (inList([cv.summary])) return "summary";
  if (
    inList(
      cv.projects.flatMap((p) => [p.name, p.description, ...p.tech, ...p.bullets])
    )
  ) {
    return "projects";
  }
  return "other";
}

function buildSuggestions(missing: KeywordHit[], cv: CVData): string[] {
  const top = missing.slice(0, 5);
  if (!top.length) return [];

  const role = cv.personal.title || cv.meta.targetRole || "your role";
  const out: string[] = [];

  const skillLike = top.filter((k) => !SOFT_SKILLS.has(k.term));
  if (skillLike.length) {
    out.push(
      `Add a "${skillLike
        .slice(0, 3)
        .map((k) => k.surface)
        .join(", ")}" group to your Skills section — but only for tools you have actually used.`
    );
  }

  for (const kw of top.slice(0, 3)) {
    out.push(
      `Work "${kw.surface}" into a result-driven bullet, e.g. "Built X with ${kw.surface}, reducing Y by Z%" under your ${role} entry.`
    );
  }

  return out;
}

/**
 * Compares a CV against a job posting and reports keyword coverage.
 *
 * The score is importance-weighted: missing a keyword the posting lists under
 * "Requirements" costs far more than missing one mentioned in passing.
 */
export function matchJobDescription(
  cv: CVData,
  jobDescription: string
): JobMatchResult {
  const index = buildTextIndex(cv);
  const raw = extractKeywords(jobDescription);

  const ranked = raw
    .map((kw) => ({ ...kw, importance: importanceOf(kw) }))
    .filter((kw) => kw.known || kw.occurrences >= 2 || kw.required)
    .sort((a, b) => b.importance - a.importance || b.occurrences - a.occurrences)
    .slice(0, 60);

  const matched: KeywordHit[] = [];
  const missing: KeywordHit[] = [];

  for (const kw of ranked) {
    const present =
      indexContains(index, kw.term) ||
      indexContains(index, kw.surface) ||
      index.skills.some((s) => canonicalize(s) === kw.term);

    const hit: KeywordHit = {
      term: kw.term,
      surface: kw.surface,
      importance: kw.importance,
      occurrences: kw.occurrences,
      required: kw.required,
    };

    if (present) {
      hit.foundIn = locate(cv, kw.term);
      matched.push(hit);
    } else {
      missing.push(hit);
    }
  }

  const totalWeight = ranked.reduce((s, k) => s + k.importance, 0);
  const matchedWeight = matched.reduce((s, k) => s + k.importance, 0);
  const score = totalWeight
    ? Math.round((matchedWeight / totalWeight) * 100)
    : 0;

  const criticalMissing = missing.filter((k) => k.required || k.importance >= 7);

  let headline: string;
  if (!ranked.length) {
    headline = "That posting was too short to pull reliable keywords from.";
  } else if (score >= 80) {
    headline = `Strong match at ${score}%. You clear the keyword bar for this posting.`;
  } else if (score >= 60) {
    headline = `${score}% match. Close — adding ${criticalMissing.length || missing.length} missing terms would put you in the top pile.`;
  } else if (score >= 40) {
    headline = `${score}% match. Rewrite your summary and skills around this posting's language before applying.`;
  } else {
    headline = `${score}% match. This CV is aimed at a different role than the posting describes.`;
  }

  return {
    score,
    matched: matched.sort((a, b) => b.importance - a.importance),
    missing: missing.sort((a, b) => b.importance - a.importance),
    criticalMissing,
    totalKeywords: ranked.length,
    headline,
    suggestions: buildSuggestions(missing, cv),
    generatedAt: Date.now(),
  };
}
