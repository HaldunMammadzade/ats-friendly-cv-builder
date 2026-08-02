/**
 * CV domain model.
 *
 * Bumping CV_SCHEMA_VERSION requires a matching branch in `migrateCV`
 * (lib/cv/migrate.ts) so older stored documents keep opening.
 */
export const CV_SCHEMA_VERSION = 2;

export interface Personal {
  fullName: string;
  /** Target job title, rendered directly under the name. */
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export type EmploymentType =
  | ""
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Freelance"
  | "Internship";

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  tech: string[];
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa: string;
  details: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  link: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: string[];
  tech: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  url: string;
}

export type LanguageLevel =
  | "Native"
  | "C2"
  | "C1"
  | "B2"
  | "B1"
  | "A2"
  | "A1";

export interface LanguageItem {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface CustomEntry {
  id: string;
  heading: string;
  subheading: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomEntry[];
}

export type TemplateId = "classic" | "compact" | "modern";
/** Restricted to font stacks every ATS parser and PDF viewer can embed. */
export type FontFamilyId = "sans" | "serif" | "mixed";
export type PaperSize = "a4" | "letter";

export interface CVDesign {
  template: TemplateId;
  fontFamily: FontFamilyId;
  /** Base body size in pt. Anything under 9.5 hurts human readability. */
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  /** Hex colour used only for headings and rules, never for body text. */
  accentColor: string;
  paperSize: PaperSize;
  /** Page margin in millimetres. */
  margin: number;
}

export interface CVMeta {
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
}

export type SectionKey =
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "awards"
  | "languages";

export interface SectionConfig {
  key: SectionKey;
  visible: boolean;
  /** Overrides the default heading, e.g. "Professional Experience". */
  title: string;
}

export interface CVData {
  schemaVersion: number;
  id: string;
  name: string;
  personal: Personal;
  summary: string;
  skills: SkillGroup[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  languages: LanguageItem[];
  awards: AwardItem[];
  customSections: CustomSection[];
  sections: SectionConfig[];
  design: CVDesign;
  meta: CVMeta;
  createdAt: number;
  updatedAt: number;
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Professional Summary",
  skills: "Skills",
  experience: "Work Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  awards: "Awards & Achievements",
  languages: "Languages",
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "awards",
  "languages",
];

export const LANGUAGE_LEVELS: LanguageLevel[] = [
  "Native",
  "C2",
  "C1",
  "B2",
  "B1",
  "A2",
  "A1",
];

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  "",
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
];
