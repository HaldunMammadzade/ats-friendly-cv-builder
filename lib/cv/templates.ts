import type { CVDesign, FontFamilyId, TemplateId } from "@/types/cv";

/**
 * Template definitions shared by the HTML preview, the PDF exporter and the
 * DOCX exporter.
 *
 * Deliberate constraints, all of them ATS requirements rather than taste:
 * single column, no tables for layout, no images, no icons, no text in
 * headers/footers, and only fonts that PDF viewers embed natively.
 */

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  bestFor: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Full-width rules under uppercase headings. The most conservative and most widely parsed layout.",
    bestFor: "Corporate, finance, consulting, government",
  },
  {
    id: "compact",
    name: "Compact",
    description:
      "Tighter leading and smaller headings to fit a dense career onto one page without shrinking the body text.",
    bestFor: "Senior engineers with 8+ years of history",
  },
  {
    id: "modern",
    name: "Modern",
    description:
      "Accent-coloured headings and a centred header. Still single-column plain text underneath.",
    bestFor: "Startups, product, design-adjacent roles",
  },
];

export const FONT_OPTIONS: {
  id: FontFamilyId;
  name: string;
  note: string;
}[] = [
  { id: "sans", name: "Helvetica / Arial", note: "Safest default. Reads well on screen." },
  { id: "serif", name: "Times / Georgia", note: "Traditional. Fits more words per line." },
  { id: "mixed", name: "Serif headings + sans body", note: "Structured but easy to skim." },
];

interface TemplateTokens {
  headingUppercase: boolean;
  headingLetterSpacing: number;
  /** Multiplier applied to the base font size. */
  headingScale: number;
  nameScale: number;
  nameUppercase: boolean;
  headerAlign: "left" | "center";
  rule: "full" | "under-heading" | "none";
  accentOn: "heading" | "name-and-heading" | "none";
  /** Multiplies the user's section spacing. */
  densityScale: number;
  bulletChar: string;
}

const TOKENS: Record<TemplateId, TemplateTokens> = {
  classic: {
    headingUppercase: true,
    headingLetterSpacing: 0.6,
    headingScale: 1.0,
    nameScale: 2.1,
    nameUppercase: false,
    headerAlign: "left",
    rule: "full",
    accentOn: "none",
    densityScale: 1,
    bulletChar: "\u2022",
  },
  compact: {
    headingUppercase: true,
    headingLetterSpacing: 0.8,
    headingScale: 0.94,
    nameScale: 1.8,
    nameUppercase: true,
    headerAlign: "left",
    rule: "under-heading",
    accentOn: "none",
    densityScale: 0.72,
    bulletChar: "\u2013",
  },
  modern: {
    headingUppercase: true,
    headingLetterSpacing: 1.1,
    headingScale: 1.02,
    nameScale: 2.3,
    nameUppercase: false,
    headerAlign: "center",
    rule: "full",
    accentOn: "name-and-heading",
    densityScale: 1.08,
    bulletChar: "\u2022",
  },
};

/** CSS stacks for the HTML preview. */
const CSS_FONTS: Record<FontFamilyId, { body: string; heading: string }> = {
  sans: {
    body: 'Helvetica, Arial, "Helvetica Neue", sans-serif',
    heading: 'Helvetica, Arial, "Helvetica Neue", sans-serif',
  },
  serif: {
    body: '"Times New Roman", Times, Georgia, serif',
    heading: '"Times New Roman", Times, Georgia, serif',
  },
  mixed: {
    body: 'Helvetica, Arial, "Helvetica Neue", sans-serif',
    heading: '"Times New Roman", Times, Georgia, serif',
  },
};

/** Built-in PDF base-14 families; no font files to embed, no parsing risk. */
const PDF_FONTS: Record<FontFamilyId, { body: string; heading: string }> = {
  sans: { body: "Helvetica", heading: "Helvetica" },
  serif: { body: "Times-Roman", heading: "Times-Roman" },
  mixed: { body: "Helvetica", heading: "Times-Roman" },
};

/** DOCX needs real font names, not stacks. */
const DOCX_FONTS: Record<FontFamilyId, { body: string; heading: string }> = {
  sans: { body: "Arial", heading: "Arial" },
  serif: { body: "Times New Roman", heading: "Times New Roman" },
  mixed: { body: "Arial", heading: "Georgia" },
};

export const PAPER_MM: Record<CVDesign["paperSize"], { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

export interface ResolvedTheme {
  tokens: TemplateTokens;
  /** Point sizes, already multiplied out. */
  size: {
    body: number;
    heading: number;
    name: number;
    title: number;
    contact: number;
    meta: number;
    small: number;
  };
  space: {
    section: number;
    entry: number;
    bullet: number;
    afterHeading: number;
  };
  color: {
    text: string;
    muted: string;
    accent: string;
    rule: string;
  };
  lineHeight: number;
  fonts: {
    css: { body: string; heading: string };
    pdf: { body: string; heading: string };
    docx: { body: string; heading: string };
  };
  page: { widthMm: number; heightMm: number; marginMm: number };
}

/** Turns user design settings plus the template's tokens into concrete values. */
export function resolveTheme(design: CVDesign): ResolvedTheme {
  const tokens = TOKENS[design.template] ?? TOKENS.classic;
  const base = design.fontSize;
  const spacing = design.sectionSpacing * tokens.densityScale;
  const paper = PAPER_MM[design.paperSize] ?? PAPER_MM.a4;

  const accent =
    tokens.accentOn === "none" ? "#111827" : design.accentColor || "#111827";

  return {
    tokens,
    size: {
      body: base,
      heading: base * tokens.headingScale + 0.5,
      name: base * tokens.nameScale,
      title: base * 1.12,
      contact: base * 0.92,
      meta: base * 0.94,
      small: base * 0.86,
    },
    space: {
      section: spacing,
      entry: spacing * 0.55,
      bullet: spacing * 0.16,
      afterHeading: spacing * 0.34,
    },
    color: {
      text: "#111827",
      muted: "#4b5563",
      accent,
      rule: tokens.accentOn === "none" ? "#111827" : accent,
    },
    lineHeight: design.lineHeight,
    fonts: {
      css: CSS_FONTS[design.fontFamily] ?? CSS_FONTS.sans,
      pdf: PDF_FONTS[design.fontFamily] ?? PDF_FONTS.sans,
      docx: DOCX_FONTS[design.fontFamily] ?? DOCX_FONTS.sans,
    },
    page: { widthMm: paper.w, heightMm: paper.h, marginMm: design.margin },
  };
}

export const MM_TO_PT = 2.834645669;
export const MM_TO_PX = 3.779527559;
