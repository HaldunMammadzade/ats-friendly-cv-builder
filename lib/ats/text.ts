import type { CVData } from "@/types/cv";
import { ALIAS_TO_CANONICAL, STOP_WORDS } from "./dictionary";

/** Lower-cases, strips accents and collapses punctuation to single spaces. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9+#./'\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(input: string): string[] {
  const normalized = normalize(input);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

export function contentWords(input: string): string[] {
  return words(input).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Contiguous n-grams, used to catch multi-word skills like "system design". */
export function ngrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

/** Maps a surface form to its canonical skill name when one is known. */
export function canonicalize(term: string): string {
  const key = normalize(term);
  return ALIAS_TO_CANONICAL.get(key) ?? key;
}

export const hasNumber = (s: string) => /\d/.test(s);

/** Detects quantified impact: 40%, $1.2M, 3x, 12 hours, 2,000 users. */
export const QUANTIFIER_PATTERN =
  /(\d+(?:[.,]\d+)?\s*%)|([$€£₼]\s?\d)|(\b\d+(?:[.,]\d+)?\s?(?:k|m|bn|b)\b)|(\b\d+\s?x\b)|(\b\d{1,3}(?:,\d{3})+\b)|(\b\d+(?:\.\d+)?\s*(?:users|customers|clients|people|engineers|developers|hours|days|weeks|months|years|requests|records|transactions|tickets|projects|teams|countries|ms|seconds|sec|s\b|gb|tb|qps|rps))/i;

export const isQuantified = (s: string) => QUANTIFIER_PATTERN.test(s);

/** First meaningful word of a bullet, with any leading marker removed. */
export function leadingWord(bullet: string): string {
  const cleaned = bullet.replace(/^[\s\-–—•*·]+/, "");
  const match = /^[A-Za-z']+/.exec(cleaned.trim());
  return match ? match[0].toLowerCase() : "";
}

/** Crude but stable stemmer for matching "developing" against "develop". */
export function stem(word: string): string {
  if (word.length <= 4) return word;
  return word
    .replace(/(ing|edly|edness)$/, "")
    .replace(/(ies)$/, "y")
    .replace(/(ed|es|s)$/, "")
    .replace(/(ment|ness|tion|sion)$/, "");
}

export interface CVTextIndex {
  /** Everything, joined — used for keyword presence checks. */
  full: string;
  normalized: string;
  tokens: string[];
  tokenSet: Set<string>;
  stemSet: Set<string>;
  bigramSet: Set<string>;
  trigramSet: Set<string>;
  bullets: string[];
  skills: string[];
  wordCount: number;
}

/** Flattens a CV into the searchable text the scorer and matcher both use. */
export function buildTextIndex(cv: CVData): CVTextIndex {
  const parts: string[] = [];
  const bullets: string[] = [];

  const p = cv.personal;
  parts.push(p.fullName, p.title, p.email, p.phone, p.location, p.website, p.linkedin, p.github);
  parts.push(cv.summary);

  const skills = cv.skills.flatMap((g) => [g.category, ...g.items]);
  parts.push(...skills);

  for (const e of cv.experience) {
    parts.push(e.role, e.company, e.location, e.employmentType, ...e.tech);
    for (const b of e.bullets) {
      if (b.trim()) {
        bullets.push(b.trim());
        parts.push(b);
      }
    }
  }

  for (const pr of cv.projects) {
    parts.push(pr.name, pr.role, pr.description, ...pr.tech);
    for (const b of pr.bullets) {
      if (b.trim()) {
        bullets.push(b.trim());
        parts.push(b);
      }
    }
  }

  for (const ed of cv.education) {
    parts.push(ed.degree, ed.field, ed.school, ed.location, ed.details);
  }
  for (const c of cv.certifications) parts.push(c.name, c.issuer);
  for (const a of cv.awards) parts.push(a.title, a.issuer, a.description);
  for (const l of cv.languages) parts.push(l.name);
  for (const cs of cv.customSections) {
    parts.push(cs.title);
    for (const entry of cs.entries) {
      parts.push(entry.heading, entry.subheading, entry.location);
      for (const b of entry.bullets) {
        if (b.trim()) {
          bullets.push(b.trim());
          parts.push(b);
        }
      }
    }
  }

  const full = parts.filter(Boolean).join("\n");
  const normalized = normalize(full);
  const tokens = normalized ? normalized.split(" ").filter(Boolean) : [];

  return {
    full,
    normalized,
    tokens,
    tokenSet: new Set(tokens),
    stemSet: new Set(tokens.map(stem)),
    bigramSet: new Set(ngrams(tokens, 2)),
    trigramSet: new Set(ngrams(tokens, 3)),
    bullets,
    skills: skills.filter(Boolean),
    wordCount: tokens.length,
  };
}

/** True when a single- or multi-word term appears anywhere in the CV. */
export function indexContains(index: CVTextIndex, term: string): boolean {
  const key = normalize(term);
  if (!key) return false;
  const parts = key.split(" ");
  if (parts.length === 1) {
    return index.tokenSet.has(key) || index.stemSet.has(stem(key));
  }
  if (parts.length === 2) return index.bigramSet.has(key);
  if (parts.length === 3) return index.trigramSet.has(key);
  return index.normalized.includes(key);
}
