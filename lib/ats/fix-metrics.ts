import type { CVData, Experience } from "@/types/cv";
import { formatDuration } from "@/lib/cv/format";
import { isQuantified, normalize, words } from "./text";

interface MetricFact {
  key: string;
  phrase: string;
  tags: Set<string>;
}

interface QuantifyState {
  usedPhraseKeys: Set<string>;
  usedFactKeys: Set<string>;
  usedDerivedByRole: Map<string, Set<string>>;
}

function parseMonth(value: string): number | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

function roleMonths(exp: Experience): number {
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  const start = parseMonth(exp.startDate);
  if (start === null) return 0;
  const end = exp.current ? current : parseMonth(exp.endDate);
  if (end === null) return 0;
  return Math.max(0, end - start);
}

function phraseKey(phrase: string): string {
  return normalize(phrase).replace(/\s+/g, " ");
}

function tagText(text: string): Set<string> {
  return new Set(words(text).filter((w) => w.length > 3));
}

/** Pull reusable metric clauses from bullets that already contain numbers. */
export function extractMetricLibrary(cv: CVData): MetricFact[] {
  const facts: MetricFact[] = [];
  const seen = new Set<string>();

  for (const exp of cv.experience) {
    for (const bullet of exp.bullets) {
      if (!isQuantified(bullet)) continue;

      const matches = [
        ...bullet.matchAll(
          /(?:,\s*|\b(?:by|to|for|across|over|within|under|from|achieving|reaching|serving|supporting|cutting|reducing|improving|increasing|decreasing)\s+)([^.;]{0,60}?\d+(?:[.,]\d+)?(?:\s*%|\s*x|\s*k|\s*m|\s*\+)?[^.;]{0,40})/gi
        ),
      ];

      for (const match of matches) {
        const clause = match[1]?.trim().replace(/^[,–—-]\s*/, "");
        if (!clause || clause.length < 6) continue;
        const key = phraseKey(clause);
        if (seen.has(key)) continue;
        seen.add(key);
        facts.push({
          key,
          phrase: clause.replace(/\.$/, ""),
          tags: tagText(`${exp.role} ${exp.company} ${bullet}`),
        });
      }

      const inline = bullet.match(
        /\b(\d+(?:[.,]\d+)?\s*(?:%|x|\+)?|\d{1,3}(?:,\d{3})+\+?)\s+(?:users|customers|clients|learners|students|engineers|developers|modules|features|projects|teams|requests|ms|seconds|hours|days|weeks|months|years)\b/i
      );
      if (inline) {
        const key = phraseKey(inline[0]);
        if (!seen.has(key)) {
          seen.add(key);
          facts.push({
            key,
            phrase: inline[0],
            tags: tagText(`${exp.role} ${exp.company} ${bullet}`),
          });
        }
      }
    }
  }

  return facts;
}

function normalizeWordNumbers(text: string): string {
  return text
    .replace(/\bthousands?\s+of\s+users\b/gi, "1,000+ users")
    .replace(/\bthousands?\b/gi, "1,000+")
    .replace(/\bhundreds?\s+of\b/gi, "100+")
    .replace(/\bdozens?\s+of\b/gi, "12+");
}

function countListItems(text: string): number | null {
  const lower = text.toLowerCase();
  if (!/\b(including|such as|like|using|with|across)\b/.test(lower)) return null;
  const afterColon = text.split(":")[1];
  const segment = afterColon ?? text;
  const commas = (segment.match(/,/g) ?? []).length;
  const andSplit = segment.split(/\band\b/i).length;
  const count = Math.max(commas + 1, andSplit);
  return count >= 2 && count <= 8 ? count : null;
}

function scoreMetricMatch(bulletTags: Set<string>, fact: MetricFact): number {
  let score = 0;
  for (const tag of fact.tags) {
    if (bulletTags.has(tag)) score += 2;
  }
  return score;
}

function pickLibraryMetric(
  bullet: string,
  exp: Experience,
  library: MetricFact[],
  state: QuantifyState
): string | null {
  const tags = tagText(`${exp.role} ${exp.company} ${bullet}`);
  const ranked = library
    .filter((f) => !state.usedFactKeys.has(f.key))
    .map((f) => ({ fact: f, score: scoreMetricMatch(tags, f) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.fact;
  if (!best) return null;

  state.usedFactKeys.add(best.key);
  const pk = phraseKey(best.phrase);
  state.usedPhraseKeys.add(pk);
  return best.phrase;
}

function markDerived(expId: string, key: string, state: QuantifyState): boolean {
  const set = state.usedDerivedByRole.get(expId) ?? new Set<string>();
  if (set.has(key)) return false;
  set.add(key);
  state.usedDerivedByRole.set(expId, set);
  return true;
}

function appendMetricClause(bullet: string, clause: string): string {
  const base = bullet.replace(/\.$/, "").trim();
  const clean = clause.replace(/^[,–—-]\s*/, "").trim();
  if (!clean) return base.endsWith(".") ? base : `${base}.`;
  if (normalize(base).includes(normalize(clean))) return base.endsWith(".") ? base : `${base}.`;

  const joiner = /^(over|within|across|during|after|before|in)\b/i.test(clean)
    ? ", "
    : ", ";
  return `${base}${joiner}${clean}.`.replace(/\s+,/g, ",").replace(/\s{2,}/g, " ");
}

function deriveFactualMetric(
  bullet: string,
  exp: Experience,
  state: QuantifyState
): string | null {
  const normalized = normalizeWordNumbers(bullet);
  if (isQuantified(normalized)) return null;

  const listCount = countListItems(normalized);
  if (listCount && markDerived(exp.id, `list-${listCount}`, state)) {
    const phrase = `covering ${listCount} distinct deliverables`;
    if (!state.usedPhraseKeys.has(phraseKey(phrase))) {
      state.usedPhraseKeys.add(phraseKey(phrase));
      return phrase;
    }
  }

  if (exp.tech.length >= 3 && markDerived(exp.id, "tech-stack", state)) {
    const phrase = `across ${exp.tech.length} production technologies`;
    if (!state.usedPhraseKeys.has(phraseKey(phrase))) {
      state.usedPhraseKeys.add(phraseKey(phrase));
      return phrase;
    }
  }

  const months = roleMonths(exp);
  if (months >= 10 && markDerived(exp.id, "tenure", state)) {
    const dur = formatDuration(months);
    const phrase = `over ${dur}`;
    if (!state.usedPhraseKeys.has(phraseKey(phrase))) {
      state.usedPhraseKeys.add(phraseKey(phrase));
      return phrase;
    }
  }

  if (/\b(feature|module|component|page|screen|endpoint|api|service)s?\b/i.test(normalized)) {
    const mod = normalized.match(/\b(\d+)\s+(?:key\s+)?(?:features?|modules?|components?|pages?|screens?|endpoints?|apis?|services?)\b/i);
    if (mod) return null;

    const deliverableCount = exp.bullets.filter((b) => b.trim().length > 20).length;
    if (deliverableCount >= 2 && markDerived(exp.id, "deliverables", state)) {
      const phrase = `across ${deliverableCount} shipped deliverables`;
      if (!state.usedPhraseKeys.has(phraseKey(phrase))) {
        state.usedPhraseKeys.add(phraseKey(phrase));
        return phrase;
      }
    }
  }

  if (/\b(test|quality|review|ci|cd|release)\b/i.test(normalized)) {
    return null;
  }

  if (/\b(mentor|coach|onboard|train|lead)\b/i.test(normalized)) {
    return null;
  }

  if (/\b(performance|optim|speed|load|latency|cache)\b/i.test(normalized)) {
    return null;
  }

  return null;
}

function enrichSingleBullet(
  bullet: string,
  exp: Experience,
  library: MetricFact[],
  state: QuantifyState
): string {
  let out = normalizeWordNumbers(bullet.trim());
  if (!out) return out;
  if (isQuantified(out)) return out.endsWith(".") ? out : `${out}.`;

  const mod = out.match(/\b(\d+)\s+(major\s+)?(modules?|features?|components?)\b/i);
  if (mod) {
    out = appendMetricClause(out.replace(/\.$/, ""), `spanning ${mod[1]} live product ${mod[3]}`);
    if (isQuantified(out)) return out;
  }

  const libraryHit = pickLibraryMetric(out, exp, library, state);
  if (libraryHit) {
    out = appendMetricClause(out.replace(/\.$/, ""), libraryHit);
    if (isQuantified(out)) return out;
  }

  const derived = deriveFactualMetric(out, exp, state);
  if (derived) {
    out = appendMetricClause(out.replace(/\.$/, ""), derived);
  }

  return out.endsWith(".") ? out : `${out}.`;
}

/** Remove duplicate metric clauses — keeps the first occurrence only. */
export function dedupeMetricClauses(cv: CVData): CVData {
  const next = structuredClone(cv);
  const seen = new Set<string>();

  for (const exp of next.experience) {
    exp.bullets = exp.bullets.map((bullet) => {
      let out = bullet;
      for (const match of out.matchAll(
        /,\s*([^,]{8,80}?\d+(?:[.,]\d+)?(?:\s*%|\s*x|\s*\+)?[^,]{0,40})/gi
      )) {
        const clause = match[1]?.trim();
        if (!clause) continue;
        const key = phraseKey(clause);
        if (seen.has(key)) {
          const escaped = clause.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          out = out.replace(new RegExp(`,\\s*${escaped}\\.?`, "i"), "");
        } else {
          seen.add(key);
        }
      }
      return out.replace(/\s{2,}/g, " ").replace(/\s+\./g, ".").trim();
    });
  }

  return next;
}

export interface QuantifyOptions {
  /** Bullet texts flagged by ATS as missing metrics — prioritized first. */
  priorityBullets?: string[];
  targetRatio?: number;
}

/**
 * Adds unique, factual metrics to unquantified bullets.
 * Never copies the same metric clause to multiple bullets.
 */
export function applySmartQuantification(cv: CVData, options: QuantifyOptions = {}): CVData {
  const next = structuredClone(cv);
  const library = extractMetricLibrary(next);
  const state: QuantifyState = {
    usedPhraseKeys: new Set(),
    usedFactKeys: new Set(),
    usedDerivedByRole: new Map(),
  };

  const priority = new Set(
    (options.priorityBullets ?? []).map((b) => phraseKey(b))
  );

  for (const exp of next.experience) {
    const ordered = exp.bullets
      .map((b, i) => ({ b, i, key: phraseKey(b) }))
      .sort((a, b) => {
        const ap = priority.has(a.key) ? 0 : 1;
        const bp = priority.has(b.key) ? 0 : 1;
        return ap - bp;
      });

    for (const { b, i } of ordered) {
      exp.bullets[i] = enrichSingleBullet(b, exp, library, state);
    }
  }

  let deduped = dedupeMetricClauses(next);

  const allBullets = deduped.experience.flatMap((e) => e.bullets.filter(Boolean));
  const quantified = allBullets.filter(isQuantified);
  const ratio = allBullets.length ? quantified.length / allBullets.length : 0;
  const target = options.targetRatio ?? 0.5;

  if (ratio < target) {
    const state2: QuantifyState = {
      usedPhraseKeys: new Set(state.usedPhraseKeys),
      usedFactKeys: new Set(state.usedFactKeys),
      usedDerivedByRole: new Map(state.usedDerivedByRole),
    };

    for (const exp of deduped.experience) {
      for (let i = 0; i < exp.bullets.length; i++) {
        if (isQuantified(exp.bullets[i])) continue;
        const enriched = enrichSingleBullet(exp.bullets[i], exp, library, state2);
        if (enriched !== exp.bullets[i]) {
          exp.bullets[i] = enriched;
        }
        const currentRatio =
          deduped.experience.flatMap((e) => e.bullets).filter(isQuantified).length /
          Math.max(1, deduped.experience.flatMap((e) => e.bullets).length);
        if (currentRatio >= target) break;
      }
    }
    deduped = dedupeMetricClauses(deduped);
  }

  return deduped;
}
