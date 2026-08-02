import { CVData, CV_SCHEMA_VERSION, LANGUAGE_LEVELS } from "@/types/cv";
import { cvDataSchema } from "./schema";
import { emptyCV } from "./defaults";

type Loose = Record<string, unknown>;

const isObject = (v: unknown): v is Loose =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asArray = (v: unknown): Loose[] =>
  Array.isArray(v) ? v.filter(isObject) : [];

/** "React | Next.js, TypeScript" -> ["React", "Next.js", "TypeScript"] */
export const splitList = (v: unknown): string[] => {
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof v !== "string") return [];
  return v
    .split(/[|,;•·\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const normalizeLevel = (v: unknown): string => {
  const raw = String(v ?? "").trim();
  if (!raw) return "B2";
  const upper = raw.toUpperCase();
  if (LANGUAGE_LEVELS.includes(upper as never)) return upper;
  const byWord: Record<string, string> = {
    NATIVE: "Native",
    MOTHER: "Native",
    BILINGUAL: "Native",
    FLUENT: "C1",
    ADVANCED: "C1",
    PROFICIENT: "C1",
    "UPPER-INTERMEDIATE": "B2",
    INTERMEDIATE: "B1",
    "PRE-INTERMEDIATE": "A2",
    ELEMENTARY: "A2",
    BEGINNER: "A1",
    BASIC: "A1",
  };
  for (const [needle, level] of Object.entries(byWord)) {
    if (upper.includes(needle)) return level;
  }
  return "B2";
};

/**
 * Upgrades a v1 document (flat comma-joined strings, no design/meta/sections)
 * to the current shape. Unknown or corrupt input degrades to a blank CV rather
 * than throwing, so a bad localStorage entry can never lock the user out.
 */
export function migrateCV(input: unknown): CVData {
  if (!isObject(input)) return emptyCV();

  const version = typeof input.schemaVersion === "number" ? input.schemaVersion : 1;
  const source: Loose = version >= 2 ? input : upgradeV1toV2(input);

  const result = cvDataSchema.safeParse(source);
  if (!result.success) return emptyCV(String(input.name ?? "Untitled CV"));

  return { ...result.data, schemaVersion: CV_SCHEMA_VERSION } as CVData;
}

function upgradeV1toV2(v1: Loose): Loose {
  return {
    ...v1,
    schemaVersion: 2,
    skills: asArray(v1.skills).map((s) => ({
      id: s.id,
      category: s.category ?? "",
      items: splitList(s.items),
    })),
    experience: asArray(v1.experience).map((e) => ({
      ...e,
      employmentType: "",
      tech: splitList(e.tech),
      bullets: Array.isArray(e.bullets) ? e.bullets : [],
    })),
    education: asArray(v1.education).map((e) => ({
      ...e,
      field: "",
      current: false,
      gpa: "",
    })),
    projects: asArray(v1.projects).map((p) => ({
      ...p,
      role: "",
      startDate: "",
      endDate: "",
      bullets: [],
      tech: splitList(p.tech),
    })),
    languages: asArray(v1.languages).map((l) => ({
      id: l.id,
      name: l.name ?? "",
      level: normalizeLevel(l.level),
    })),
    certifications: [],
    awards: [],
    customSections: [],
  };
}

/** Parses arbitrary JSON (imports, API payloads) into a valid CV document. */
export function parseCV(input: unknown, fallbackName = "Untitled CV"): CVData {
  const migrated = migrateCV(input);
  if (!migrated.name) migrated.name = fallbackName;
  return migrated;
}
