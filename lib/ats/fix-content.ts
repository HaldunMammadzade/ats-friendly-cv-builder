import type { CVData, Experience } from "@/types/cv";
import { SECTION_LABELS } from "@/types/cv";
import { formatDuration } from "@/lib/cv/format";
import { uid } from "@/lib/uid";
import {
  ACTION_VERBS,
  SKILL_ALIASES,
  SOFT_SKILLS,
  WEAK_PHRASES,
} from "./dictionary";
import { isQuantified, leadingWord, normalize, words } from "./text";
import { applySmartQuantification, dedupeMetricClauses } from "./fix-metrics";

export interface RoleContext {
  role: string;
  company: string;
  tech: string[];
  bullets: string[];
  title: string;
}

const OPENER_UPGRADES: Record<string, string> = {
  worked: "Delivered",
  work: "Delivered",
  helped: "Supported",
  made: "Built",
  did: "Executed",
  used: "Applied",
  developing: "Developed",
  managing: "Managed",
  leading: "Led",
  building: "Built",
};

const VERB_ALTERNATES: Record<string, string[]> = {
  led: ["Directed", "Headed", "Spearheaded"],
  built: ["Engineered", "Developed", "Shipped"],
  developed: ["Implemented", "Delivered", "Architected"],
  improved: ["Enhanced", "Optimized", "Strengthened"],
  delivered: ["Shipped", "Launched", "Deployed"],
};

export function listPhrase(items: string[]): string {
  const clean = [...new Set(items.filter(Boolean))];
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

function capitalizeSentence(text: string): string {
  const t = text.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export function stripPronouns(text: string): string {
  return capitalizeSentence(
    text
      .replace(/\b(I|We|My|Our|Me|Us)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

export function replaceWeakPhrases(text: string): string {
  let out = text;
  for (const { phrase } of WEAK_PHRASES) {
    if (!normalize(text).includes(phrase)) continue;
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = /responsible for|in charge of|worked on|helped with/i.test(phrase)
      ? out.replace(re, "Owned")
      : out.replace(re, "").replace(/\s{2,}/g, " ").trim();
  }
  return capitalizeSentence(out);
}

export function upgradeBulletOpener(bullet: string): string {
  const word = leadingWord(bullet);
  if (ACTION_VERBS.has(word)) return bullet;
  const cleaned = bullet.replace(/^[\s\-–—•*·]+/, "").trim();
  const upgrade = OPENER_UPGRADES[word];
  if (!upgrade) return capitalizeSentence(cleaned);
  return capitalizeSentence(`${upgrade} ${cleaned.slice(word.length).trim()}`.trim());
}

function parseMonth(value: string): number | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

export function experienceMonths(cv: CVData): number {
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  let total = 0;
  for (const e of cv.experience) {
    const start = parseMonth(e.startDate);
    if (start === null) continue;
    const end = e.current ? current : parseMonth(e.endDate);
    if (end === null) continue;
    total += Math.max(0, end - start);
  }
  return total;
}

export function collectTechFromCv(cv: CVData): string[] {
  const found = new Set<string>();
  const blob = normalize(
    [
      cv.summary,
      ...cv.experience.flatMap((e) => [...e.bullets, ...e.tech]),
      ...cv.skills.flatMap((g) => g.items),
    ].join(" ")
  );

  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if ([canonical, ...aliases].some((f) => blob.includes(normalize(f)))) {
      found.add(
        canonical === "next.js"
          ? "Next.js"
          : canonical === "node.js"
            ? "Node.js"
            : canonical.charAt(0).toUpperCase() + canonical.slice(1)
      );
    }
  }
  for (const item of cv.skills.flatMap((g) => g.items)) {
    if (item.trim()) found.add(item.trim());
  }
  return [...found].slice(0, 24);
}

function roleContext(cv: CVData, exp: Experience): RoleContext {
  return {
    role: exp.role,
    company: exp.company,
    tech: exp.tech,
    bullets: exp.bullets.filter((b) => b.trim()),
    title: cv.personal.title || cv.meta.targetRole,
  };
}

function normalizeWordNumbers(text: string): string {
  return text
    .replace(/\bthousands?\s+of\s+users\b/gi, "1,000+ users")
    .replace(/\bthousands?\b/gi, "1,000+");
}

export function professionalizeBullet(
  bullet: string,
  ctx: RoleContext,
  cv: CVData,
  options?: { skipQuantify?: boolean }
): string {
  let out = normalizeWordNumbers(
    replaceWeakPhrases(stripPronouns(upgradeBulletOpener(bullet)))
  ).replace(/\.$/, "");

  if (!options?.skipQuantify && !isQuantified(out)) {
    const mod = out.match(/\b(\d+)\s+(major\s+)?modules?\b/i);
    if (mod) out += ` spanning ${mod[1]} live product modules`;
  }

  if (words(out).length < 10 && ctx.tech.length) {
    out += ` using ${listPhrase(ctx.tech.slice(0, 4))}`;
  }

  return out.endsWith(".") ? out : `${out}.`;
}

export function synthesizeRoleBullet(exp: Experience, cv: CVData, index: number): string {
  const tech = exp.tech.length ? exp.tech : collectTechFromCv(cv).slice(0, 5);
  const stack = listPhrase(tech.slice(0, 4));
  const blob = exp.bullets.join(" ").toLowerCase();
  const options = [
    !/architect|migrat/i.test(blob) &&
      `Architected ${stack} solutions at ${exp.company}, establishing reusable UI patterns adopted across new modules.`,
    !/ship|launch|production/i.test(blob) &&
      `Shipped ${stack} features from design review through production release at ${exp.company}.`,
    !/test|jest|quality/i.test(blob) &&
      `Introduced Jest testing and review standards for ${stack}, improving release confidence and maintainability.`,
    !/mentor|coach|team/i.test(blob) &&
      `Mentored engineers on ${stack} delivery practices, accelerating onboarding and code quality.`,
    `Optimized ${stack} performance and UX at ${exp.company}, improving reliability for end users.`,
  ].filter(Boolean) as string[];
  return options[index % options.length] ?? options[0];
}

export function buildExecutiveSummary(cv: CVData): string {
  const title = cv.personal.title || cv.meta.targetRole || "Software professional";
  const duration = experienceMonths(cv);
  const dur = duration ? formatDuration(duration) : "";
  const skills = collectTechFromCv(cv).slice(0, 5);
  const highlights = cv.experience
    .flatMap((e) => e.bullets.filter((b) => b.trim().length > 40))
    .sort((a, b) => Number(isQuantified(b)) - Number(isQuantified(a)))
    .slice(0, 2)
    .map((b) => b.replace(/\.$/, ""));

  const lead = dur
    ? `${title} with ${dur} delivering ${listPhrase(skills)} in production environments.`
    : `${title} delivering ${listPhrase(skills)} in production environments.`;

  const body = highlights.length
    ? `${highlights.join(". ")}.`
    : "Track record of owning architecture, delivery, and cross-team execution on complex web platforms.";

  const target = cv.meta.targetRole || title;
  return `${lead} ${body} Targeting ${target} roles with scope to drive measurable product outcomes.`
    .replace(/\s+/g, " ")
    .trim();
}

export function categorizeSkills(cv: CVData) {
  const all = collectTechFromCv(cv);
  const buckets: Record<string, string[]> = {
    Frontend: [],
    "Backend & APIs": [],
    "Tools & Practices": [],
  };
  for (const skill of all) {
    if (/react|next|typescript|javascript|vue|angular|tailwind|html|css/i.test(skill)) {
      buckets.Frontend.push(skill);
    } else if (/node|express|php|laravel|api|websocket|rest/i.test(skill)) {
      buckets["Backend & APIs"].push(skill);
    } else {
      buckets["Tools & Practices"].push(skill);
    }
  }
  return Object.entries(buckets)
    .filter(([, v]) => v.length)
    .map(([category, items]) => ({ category, items: [...new Set(items)] }));
}

export function diversifyVerb(bullet: string, used: Map<string, number>): string {
  const word = leadingWord(bullet);
  const n = used.get(word) ?? 0;
  used.set(word, n + 1);
  if (n < 2 || !VERB_ALTERNATES[word]) return bullet;
  const alt = VERB_ALTERNATES[word][(n - 2) % VERB_ALTERNATES[word].length];
  const cleaned = bullet.replace(/^[\s\-–—•*·]+/, "").trim();
  return capitalizeSentence(`${alt} ${cleaned.slice(word.length).trim()}`.trim());
}

export function inferLocation(cv: CVData): string {
  if (cv.personal.location.trim()) return cv.personal.location;
  const counts = new Map<string, number>();
  for (const e of cv.experience) {
    if (e.location.trim()) counts.set(e.location, (counts.get(e.location) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export function cleanUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\?.*$/, "")
    .replace(/\/+$/, "");
}

export function normalizeLinkedIn(url: string): string {
  const cleaned = url.trim();
  if (!cleaned) return "";
  if (/linkedin\.com\/in\//i.test(cleaned)) return cleanUrl(cleaned);
  return cleaned.includes("/") ? cleanUrl(cleaned) : `linkedin.com/in/${cleaned.replace(/^@/, "")}`;
}

export function polishEntireCv(cv: CVData): CVData {
  const next = structuredClone(cv);
  const verbs = new Map<string, number>();

  if (!next.personal.title.trim() && next.meta.targetRole.trim()) {
    next.personal.title = next.meta.targetRole.trim();
  }
  const loc = inferLocation(next);
  if (loc && !next.personal.location.trim()) next.personal.location = loc;

  next.personal.linkedin = normalizeLinkedIn(next.personal.linkedin);
  next.personal.github = cleanUrl(next.personal.github);
  next.personal.website = cleanUrl(next.personal.website);

  for (const exp of next.experience) {
    if (!exp.tech.length) {
      exp.tech = collectTechFromCv(next)
        .filter((s) => normalize([...exp.bullets, exp.role].join(" ")).includes(normalize(s)))
        .slice(0, 8);
    }
    const ctx = roleContext(next, exp);
    exp.bullets = exp.bullets
      .filter((b) => b.trim())
      .map((b) => professionalizeBullet(b, ctx, next, { skipQuantify: true }));
    while (exp.bullets.length < 3 && (exp.role.trim() || exp.company.trim())) {
      exp.bullets.push(synthesizeRoleBullet(exp, next, exp.bullets.length));
    }
    exp.bullets = exp.bullets.map((b) => diversifyVerb(b, verbs));
  }

  next.experience.sort((a, b) => (parseMonth(b.startDate) ?? 0) - (parseMonth(a.startDate) ?? 0));

  const groups = categorizeSkills(next);
  if (groups.length) {
    next.skills = groups.map((g) => ({ id: uid(), category: g.category, items: g.items }));
  }

  for (const group of next.skills) {
    group.items = group.items.filter((i) => !SOFT_SKILLS.has(normalize(i)));
  }

  for (const section of next.sections) {
    section.title = SECTION_LABELS[section.key] ?? section.title;
  }

  next.summary = buildExecutiveSummary(next);
  const sum = next.sections.find((s) => s.key === "summary");
  if (sum) sum.visible = true;

  next.experience = next.experience.filter((e) => e.role.trim() || e.company.trim());

  const quantified = applySmartQuantification(next);
  return dedupeMetricClauses(quantified);
}
