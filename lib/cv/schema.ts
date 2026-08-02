import { z } from "zod";
import {
  CV_SCHEMA_VERSION,
  DEFAULT_SECTION_ORDER,
  LANGUAGE_LEVELS,
  SECTION_LABELS,
} from "@/types/cv";
import { uid } from "@/lib/uid";

/**
 * Every field carries a default so that a partially-formed or older document
 * still parses. Validation here is about producing a safe, complete object,
 * not about rejecting user input mid-edit.
 */

const str = (max = 400) => z.string().trim().max(max).default("");
const idField = z.string().default(() => uid());
const stringList = (max = 120) =>
  z
    .array(z.string().trim().max(max))
    .default([])
    .transform((v) => v.filter((s) => s.length > 0));

export const personalSchema = z.object({
  fullName: str(120),
  title: str(160),
  email: str(160),
  phone: str(60),
  location: str(160),
  website: str(240),
  linkedin: str(240),
  github: str(240),
});

export const skillGroupSchema = z.object({
  id: idField,
  category: str(80),
  items: stringList(80),
});

export const experienceSchema = z.object({
  id: idField,
  role: str(160),
  company: str(160),
  location: str(120),
  employmentType: z
    .enum(["", "Full-time", "Part-time", "Contract", "Freelance", "Internship"])
    .default(""),
  startDate: str(20),
  endDate: str(20),
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim().max(600)).default([]),
  tech: stringList(80),
});

export const educationSchema = z.object({
  id: idField,
  degree: str(160),
  field: str(160),
  school: str(200),
  location: str(120),
  startDate: str(20),
  endDate: str(20),
  current: z.boolean().default(false),
  gpa: str(20),
  details: str(600),
});

export const projectSchema = z.object({
  id: idField,
  name: str(160),
  role: str(120),
  link: str(300),
  startDate: str(20),
  endDate: str(20),
  description: str(600),
  bullets: z.array(z.string().trim().max(600)).default([]),
  tech: stringList(80),
});

export const certificationSchema = z.object({
  id: idField,
  name: str(200),
  issuer: str(160),
  issueDate: str(20),
  expiryDate: str(20),
  credentialId: str(120),
  url: str(300),
});

export const languageSchema = z.object({
  id: idField,
  name: str(80),
  level: z.enum(LANGUAGE_LEVELS as [string, ...string[]]).default("B2"),
});

export const awardSchema = z.object({
  id: idField,
  title: str(200),
  issuer: str(160),
  date: str(20),
  description: str(400),
});

export const customEntrySchema = z.object({
  id: idField,
  heading: str(200),
  subheading: str(200),
  location: str(120),
  startDate: str(20),
  endDate: str(20),
  bullets: z.array(z.string().trim().max(600)).default([]),
});

export const customSectionSchema = z.object({
  id: idField,
  title: str(80),
  entries: z.array(customEntrySchema).default([]),
});

export const sectionConfigSchema = z.object({
  key: z.enum(DEFAULT_SECTION_ORDER as [string, ...string[]]),
  visible: z.boolean().default(true),
  title: str(60),
});

export const designSchema = z.object({
  template: z.enum(["classic", "compact", "modern"]).default("classic"),
  fontFamily: z.enum(["sans", "serif", "mixed"]).default("sans"),
  fontSize: z.number().min(8.5).max(13).default(10.5),
  lineHeight: z.number().min(1).max(2).default(1.35),
  sectionSpacing: z.number().min(2).max(28).default(10),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#111827"),
  paperSize: z.enum(["a4", "letter"]).default("a4"),
  margin: z.number().min(8).max(28).default(16),
});

export const metaSchema = z.object({
  targetRole: str(160),
  targetCompany: str(160),
  jobDescription: z.string().trim().max(20000).default(""),
});

export const cvDataSchema = z.object({
  schemaVersion: z.number().default(CV_SCHEMA_VERSION),
  id: idField,
  name: z.string().trim().min(1).max(120).catch("Untitled CV"),
  personal: personalSchema.default(() => personalSchema.parse({})),
  summary: z.string().trim().max(3000).default(""),
  skills: z.array(skillGroupSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  awards: z.array(awardSchema).default([]),
  customSections: z.array(customSectionSchema).default([]),
  sections: z
    .array(sectionConfigSchema)
    .default(() =>
      DEFAULT_SECTION_ORDER.map((key) => ({
        key,
        visible: true,
        title: SECTION_LABELS[key],
      }))
    )
    .transform(reconcileSections),
  design: designSchema.default(() => designSchema.parse({})),
  meta: metaSchema.default(() => metaSchema.parse({})),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

/** Drops unknown section keys and appends any newly added ones. */
function reconcileSections(
  sections: { key: string; visible: boolean; title: string }[]
) {
  const known = new Set<string>(DEFAULT_SECTION_ORDER);
  const seen = new Set<string>();
  const out = sections
    .filter((s) => known.has(s.key) && !seen.has(s.key) && seen.add(s.key))
    .map((s) => ({
      ...s,
      title:
        s.title || SECTION_LABELS[s.key as keyof typeof SECTION_LABELS] || s.key,
    }));

  for (const key of DEFAULT_SECTION_ORDER) {
    if (!seen.has(key)) {
      out.push({ key, visible: true, title: SECTION_LABELS[key] });
    }
  }
  return out;
}

export type ParsedCV = z.infer<typeof cvDataSchema>;

export const createCVRequestSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  preset: z.enum(["empty", "sample"]).default("empty"),
  data: z.unknown().optional(),
});

export const updateCVRequestSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  data: z.unknown().optional(),
  isArchived: z.boolean().optional(),
  /** Persist a restore point before applying this update. */
  snapshot: z.boolean().optional(),
  snapshotLabel: z.string().trim().max(120).optional(),
});

export const coverLetterSchema = z.object({
  title: z.string().trim().min(1).max(160),
  company: z.string().trim().max(160).default(""),
  role: z.string().trim().max(160).default(""),
  body: z.string().max(20000).default(""),
  tone: z.enum(["professional", "friendly", "direct", "enthusiastic"]).default(
    "professional"
  ),
  resumeId: z.uuid().nullish(),
});

export const jobMatchSchema = z.object({
  jobDescription: z.string().trim().min(30).max(20000),
  resumeId: z.uuid().optional(),
  data: z.unknown().optional(),
  company: z.string().trim().max(160).optional(),
  role: z.string().trim().max(160).optional(),
  persist: z.boolean().default(false),
});
