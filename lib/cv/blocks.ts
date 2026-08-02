import type { CVData, SectionKey } from "@/types/cv";
import { cleanUrl, formatRange, joinNonEmpty } from "./format";

/**
 * A renderer-agnostic description of the document.
 *
 * The HTML preview, the PDF exporter and the DOCX exporter all consume this,
 * so content rules live in one place and the three outputs cannot drift apart.
 */

export interface HeaderBlock {
  name: string;
  title: string;
  /** Pipe-separated contact line; each item is plain text and ATS-readable. */
  contacts: string[];
}

export type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  /** A label/value row, e.g. "Backend: Node.js, PostgreSQL". */
  | { kind: "labelled"; label: string; value: string }
  /** "Azerbaijani (Native) · English (C1)" — one compact line. */
  | { kind: "inline"; text: string }
  | {
      kind: "entry";
      /** Bold, left column: job title or degree. */
      title: string;
      /** Same line as title, lighter: company or school. */
      subtitle: string;
      /** Right column, top line: date range. */
      meta: string;
      /** Right column, second line: location. */
      metaSub: string;
      bullets: string[];
      /** Trailing "Tech: …" line. */
      footnote: string;
      /** Rendered after the header, before bullets. */
      description: string;
    };

export interface DocSection {
  key: SectionKey | "custom";
  id: string;
  heading: string;
  blocks: Block[];
}

export interface RenderDocument {
  header: HeaderBlock;
  sections: DocSection[];
}

const nonEmpty = (items: string[]) => items.map((i) => i.trim()).filter(Boolean);

function headerBlock(cv: CVData): HeaderBlock {
  const p = cv.personal;
  const contacts = nonEmpty([
    p.email,
    p.phone,
    p.location,
    cleanUrl(p.linkedin),
    cleanUrl(p.github),
    cleanUrl(p.website),
  ]);
  return { name: p.fullName.trim(), title: p.title.trim(), contacts };
}

function summarySection(cv: CVData, heading: string): DocSection | null {
  const text = cv.summary.trim();
  if (!text) return null;
  return {
    key: "summary",
    id: "summary",
    heading,
    blocks: [{ kind: "paragraph", text }],
  };
}

function skillsSection(cv: CVData, heading: string): DocSection | null {
  const groups = cv.skills.filter((g) => nonEmpty(g.items).length);
  if (!groups.length) return null;

  return {
    key: "skills",
    id: "skills",
    heading,
    blocks: groups.map((g) => ({
      kind: "labelled" as const,
      label: g.category.trim(),
      value: nonEmpty(g.items).join(", "),
    })),
  };
}

function experienceSection(cv: CVData, heading: string): DocSection | null {
  const entries = cv.experience.filter((e) => e.role.trim() || e.company.trim());
  if (!entries.length) return null;

  return {
    key: "experience",
    id: "experience",
    heading,
    blocks: entries.map((e) => ({
      kind: "entry" as const,
      title: e.role.trim(),
      subtitle: joinNonEmpty([e.company.trim(), e.employmentType], " \u00b7 "),
      meta: formatRange(e.startDate, e.endDate, e.current),
      metaSub: e.location.trim(),
      description: "",
      bullets: nonEmpty(e.bullets),
      footnote: e.tech.length ? `Tech: ${nonEmpty(e.tech).join(", ")}` : "",
    })),
  };
}

function projectsSection(cv: CVData, heading: string): DocSection | null {
  const entries = cv.projects.filter((p) => p.name.trim());
  if (!entries.length) return null;

  return {
    key: "projects",
    id: "projects",
    heading,
    blocks: entries.map((p) => ({
      kind: "entry" as const,
      title: joinNonEmpty([p.name.trim(), cleanUrl(p.link)], " \u2014 "),
      subtitle: p.role.trim(),
      meta: formatRange(p.startDate, p.endDate, false),
      metaSub: "",
      description: p.description.trim(),
      bullets: nonEmpty(p.bullets),
      footnote: p.tech.length ? `Tech: ${nonEmpty(p.tech).join(", ")}` : "",
    })),
  };
}

function educationSection(cv: CVData, heading: string): DocSection | null {
  const entries = cv.education.filter((e) => e.school.trim() || e.degree.trim());
  if (!entries.length) return null;

  return {
    key: "education",
    id: "education",
    heading,
    blocks: entries.map((e) => ({
      kind: "entry" as const,
      title: joinNonEmpty([e.degree.trim(), e.field.trim()], ", "),
      subtitle: e.school.trim(),
      meta: formatRange(e.startDate, e.endDate, e.current),
      metaSub: e.location.trim(),
      description: joinNonEmpty(
        [e.gpa ? `GPA: ${e.gpa}` : "", e.details.trim()],
        " \u00b7 "
      ),
      bullets: [],
      footnote: "",
    })),
  };
}

function certificationsSection(cv: CVData, heading: string): DocSection | null {
  const entries = cv.certifications.filter((c) => c.name.trim());
  if (!entries.length) return null;

  return {
    key: "certifications",
    id: "certifications",
    heading,
    blocks: entries.map((c) => ({
      kind: "entry" as const,
      title: c.name.trim(),
      subtitle: joinNonEmpty(
        [c.issuer.trim(), c.credentialId ? `ID: ${c.credentialId}` : ""],
        " \u00b7 "
      ),
      meta: formatRange(c.issueDate, c.expiryDate, false),
      metaSub: "",
      description: cleanUrl(c.url),
      bullets: [],
      footnote: "",
    })),
  };
}

function awardsSection(cv: CVData, heading: string): DocSection | null {
  const entries = cv.awards.filter((a) => a.title.trim());
  if (!entries.length) return null;

  return {
    key: "awards",
    id: "awards",
    heading,
    blocks: entries.map((a) => ({
      kind: "entry" as const,
      title: a.title.trim(),
      subtitle: a.issuer.trim(),
      meta: a.date.trim(),
      metaSub: "",
      description: a.description.trim(),
      bullets: [],
      footnote: "",
    })),
  };
}

function languagesSection(cv: CVData, heading: string): DocSection | null {
  const entries = cv.languages.filter((l) => l.name.trim());
  if (!entries.length) return null;

  return {
    key: "languages",
    id: "languages",
    heading,
    blocks: [
      {
        kind: "inline",
        text: entries
          .map((l) => `${l.name.trim()} (${l.level})`)
          .join(" \u00b7 "),
      },
    ],
  };
}

function customSections(cv: CVData): DocSection[] {
  return cv.customSections
    .filter((cs) => cs.title.trim() && cs.entries.length)
    .map((cs) => ({
      key: "custom" as const,
      id: cs.id,
      heading: cs.title.trim(),
      blocks: cs.entries
        .filter((e) => e.heading.trim())
        .map((e) => ({
          kind: "entry" as const,
          title: e.heading.trim(),
          subtitle: e.subheading.trim(),
          meta: formatRange(e.startDate, e.endDate, false),
          metaSub: e.location.trim(),
          description: "",
          bullets: nonEmpty(e.bullets),
          footnote: "",
        })),
    }))
    .filter((s) => s.blocks.length);
}

const BUILDERS: Record<
  SectionKey,
  (cv: CVData, heading: string) => DocSection | null
> = {
  summary: summarySection,
  skills: skillsSection,
  experience: experienceSection,
  projects: projectsSection,
  education: educationSection,
  certifications: certificationsSection,
  awards: awardsSection,
  languages: languagesSection,
};

/** Builds the ordered, empty-section-free document for all three renderers. */
export function buildDocument(cv: CVData): RenderDocument {
  const sections: DocSection[] = [];

  for (const config of cv.sections) {
    if (!config.visible) continue;
    const build = BUILDERS[config.key];
    if (!build) continue;
    const section = build(cv, config.title || config.key);
    if (section) sections.push(section);
  }

  sections.push(...customSections(cv));

  return { header: headerBlock(cv), sections };
}

/** Flattens the document to plain text — used for copy-to-clipboard and tests. */
export function documentToText(doc: RenderDocument): string {
  const lines: string[] = [];
  if (doc.header.name) lines.push(doc.header.name);
  if (doc.header.title) lines.push(doc.header.title);
  if (doc.header.contacts.length) lines.push(doc.header.contacts.join(" | "));

  for (const section of doc.sections) {
    lines.push("", section.heading.toUpperCase());
    for (const block of section.blocks) {
      switch (block.kind) {
        case "paragraph":
          lines.push(block.text);
          break;
        case "inline":
          lines.push(block.text);
          break;
        case "labelled":
          lines.push(`${block.label}: ${block.value}`);
          break;
        case "bullets":
          lines.push(...block.items.map((i) => `- ${i}`));
          break;
        case "entry": {
          lines.push(
            [block.title, block.subtitle].filter(Boolean).join(" | ")
          );
          const right = [block.meta, block.metaSub].filter(Boolean).join(" | ");
          if (right) lines.push(right);
          if (block.description) lines.push(block.description);
          lines.push(...block.bullets.map((b) => `- ${b}`));
          if (block.footnote) lines.push(block.footnote);
          break;
        }
      }
    }
  }

  return lines.join("\n");
}
