import type { CVData } from "@/types/cv";
import {
  ACTION_VERBS,
  PRONOUNS,
  RISKY_CHARACTERS,
  RISKY_HEADINGS,
  SOFT_SKILLS,
  WEAK_PHRASES,
} from "./dictionary";
import {
  buildTextIndex,
  canonicalize,
  isQuantified,
  leadingWord,
  normalize,
  words,
} from "./text";

export type CheckStatus = "pass" | "warn" | "fail";

export type CheckCategory =
  | "contact"
  | "structure"
  | "content"
  | "keywords"
  | "formatting"
  | "length";

export interface AtsCheck {
  id: string;
  category: CheckCategory;
  label: string;
  status: CheckStatus;
  /** 0–1, how fully this check is satisfied. */
  score: number;
  /** Relative importance inside its category. */
  weight: number;
  message: string;
  fix?: string;
  /** Specific offending strings, so the UI can point at them. */
  items?: string[];
}

export interface CategoryScore {
  key: CheckCategory;
  label: string;
  weight: number;
  /** 0–100 within the category. */
  score: number;
  /** Points contributed to the overall 0–100 score. */
  earned: number;
}

export interface AtsStats {
  wordCount: number;
  bulletCount: number;
  quantifiedBullets: number;
  actionVerbBullets: number;
  skillCount: number;
  hardSkillCount: number;
  estimatedPages: number;
  totalExperienceMonths: number;
}

export interface AtsReport {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  headline: string;
  categories: CategoryScore[];
  checks: AtsCheck[];
  stats: AtsStats;
  generatedAt: number;
}

const CATEGORY_WEIGHTS: Record<CheckCategory, number> = {
  contact: 12,
  structure: 16,
  content: 32,
  keywords: 16,
  formatting: 12,
  length: 12,
};

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  contact: "Contact details",
  structure: "Structure",
  content: "Content quality",
  keywords: "Keywords",
  formatting: "Formatting & parsing",
  length: "Length",
};

// -----------------------------------------------------------------------------
// Date helpers — inputs are "YYYY-MM" from month pickers.
// -----------------------------------------------------------------------------

const parseMonth = (value: string): number | null => {
  const m = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 1950 || year > 2100 || month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
};

const nowMonths = () => {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
};

interface Span {
  start: number;
  end: number;
  label: string;
}

function experienceSpans(cv: CVData): Span[] {
  const spans: Span[] = [];
  for (const e of cv.experience) {
    const start = parseMonth(e.startDate);
    if (start === null) continue;
    const end = e.current ? nowMonths() : parseMonth(e.endDate);
    if (end === null) continue;
    spans.push({
      start,
      end: Math.max(start, end),
      label: `${e.role || "Role"} — ${e.company || "Company"}`,
    });
  }
  return spans.sort((a, b) => a.start - b.start);
}

/** Union of all spans, so overlapping roles aren't double counted. */
function totalMonths(spans: Span[]): number {
  if (!spans.length) return 0;
  let total = 0;
  let cursorStart = spans[0].start;
  let cursorEnd = spans[0].end;
  for (const s of spans.slice(1)) {
    if (s.start <= cursorEnd) {
      cursorEnd = Math.max(cursorEnd, s.end);
    } else {
      total += cursorEnd - cursorStart;
      cursorStart = s.start;
      cursorEnd = s.end;
    }
  }
  return total + (cursorEnd - cursorStart);
}

// -----------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[+]?[\d][\d\s()\-.]{6,}$/;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Linear ramp: 0 below `min`, 1 at or above `full`. */
const ramp = (value: number, min: number, full: number) =>
  full === min ? (value >= full ? 1 : 0) : clamp01((value - min) / (full - min));

function statusFor(score: number): CheckStatus {
  if (score >= 0.85) return "pass";
  if (score >= 0.45) return "warn";
  return "fail";
}

interface CheckInput {
  id: string;
  category: CheckCategory;
  label: string;
  weight: number;
  score: number;
  message: string;
  fix?: string;
  items?: string[];
}

const mk = (input: CheckInput): AtsCheck => ({
  ...input,
  score: clamp01(input.score),
  status: statusFor(clamp01(input.score)),
});

/**
 * Estimated page count for the rendered document.
 *
 * Derived from line count rather than raw words because headings, entry
 * headers and blank space dominate short CVs.
 */
function estimatePages(cv: CVData): number {
  const design = cv.design;
  const charsPerLine = Math.round(1050 / design.fontSize);
  const lineHeightPt = design.fontSize * design.lineHeight;
  const usableHeightPt =
    ((design.paperSize === "a4" ? 297 : 279) - design.margin * 2) * 2.8346;
  const linesPerPage = Math.max(20, Math.floor(usableHeightPt / lineHeightPt));

  const linesFor = (text: string) =>
    text ? Math.max(1, Math.ceil(text.length / charsPerLine)) : 0;

  let lines = 5; // header block: name, title, contact row, rule
  const visible = new Set(
    cv.sections.filter((s) => s.visible).map((s) => s.key)
  );

  if (visible.has("summary") && cv.summary) lines += 1.5 + linesFor(cv.summary);
  if (visible.has("skills")) {
    lines += cv.skills.length ? 1.5 : 0;
    for (const g of cv.skills) lines += linesFor(`${g.category}: ${g.items.join(", ")}`);
  }
  if (visible.has("experience")) {
    lines += cv.experience.length ? 1.5 : 0;
    for (const e of cv.experience) {
      lines += 2.4;
      for (const b of e.bullets) lines += linesFor(b) + 0.15;
      if (e.tech.length) lines += linesFor(e.tech.join(", "));
    }
  }
  if (visible.has("projects")) {
    lines += cv.projects.length ? 1.5 : 0;
    for (const p of cv.projects) {
      lines += 1.8 + linesFor(p.description);
      for (const b of p.bullets) lines += linesFor(b) + 0.15;
    }
  }
  if (visible.has("education")) {
    lines += cv.education.length ? 1.5 : 0;
    lines += cv.education.length * 2.2;
  }
  if (visible.has("certifications") && cv.certifications.length) {
    lines += 1.5 + cv.certifications.length * 1.2;
  }
  if (visible.has("awards") && cv.awards.length) {
    lines += 1.5 + cv.awards.length * 1.4;
  }
  if (visible.has("languages") && cv.languages.length) {
    lines += 1.5 + Math.ceil(cv.languages.length / 3);
  }
  for (const cs of cv.customSections) {
    lines += 1.5 + cs.entries.length * 2;
    for (const e of cs.entries) for (const b of e.bullets) lines += linesFor(b);
  }

  return Math.max(0.2, Math.round((lines / linesPerPage) * 10) / 10);
}

// -----------------------------------------------------------------------------
// Individual check groups
// -----------------------------------------------------------------------------

function contactChecks(cv: CVData): AtsCheck[] {
  const p = cv.personal;
  const out: AtsCheck[] = [];

  out.push(
    mk({
      id: "contact.name",
      category: "contact",
      label: "Full name",
      weight: 3,
      score: p.fullName.trim().split(/\s+/).length >= 2 ? 1 : p.fullName ? 0.5 : 0,
      message: p.fullName
        ? p.fullName.trim().split(/\s+/).length >= 2
          ? "Your full name is at the top of the document."
          : "Only one name found."
        : "No name found.",
      fix: "Put your first and last name on the first line, on its own.",
    })
  );

  const emailValid = EMAIL_RE.test(p.email.trim());
  out.push(
    mk({
      id: "contact.email",
      category: "contact",
      label: "Email address",
      weight: 3,
      score: emailValid ? 1 : 0,
      message: emailValid
        ? "A valid email address is present."
        : p.email
          ? `"${p.email}" is not a valid email address.`
          : "No email address. Most ATS reject a resume it cannot reply to.",
      fix: "Use a plain professional address, e.g. firstname.lastname@gmail.com.",
    })
  );

  const phoneValid = PHONE_RE.test(p.phone.trim());
  out.push(
    mk({
      id: "contact.phone",
      category: "contact",
      label: "Phone number",
      weight: 2,
      score: phoneValid ? 1 : 0,
      message: phoneValid
        ? "Phone number is present and parseable."
        : "Add a phone number in international format.",
      fix: "Write it as +994 50 000 00 00 so international recruiters can dial it.",
    })
  );

  out.push(
    mk({
      id: "contact.location",
      category: "contact",
      label: "Location",
      weight: 2,
      score: p.location.trim() ? 1 : 0,
      message: p.location
        ? "Location is present."
        : "No location. Recruiters filter by location and time zone.",
      fix: 'For remote roles write "Baku, Azerbaijan (Remote, UTC+4)".',
    })
  );

  const hasLinkedIn = /linkedin\.com\/in\//i.test(p.linkedin);
  out.push(
    mk({
      id: "contact.linkedin",
      category: "contact",
      label: "LinkedIn profile",
      weight: 2,
      score: hasLinkedIn ? 1 : p.linkedin ? 0.5 : 0,
      message: hasLinkedIn
        ? "LinkedIn profile URL is present."
        : "No LinkedIn URL. It is the first thing most recruiters open.",
      fix: "Use the full path, e.g. linkedin.com/in/yourname.",
    })
  );

  const portfolio = Boolean(p.github.trim() || p.website.trim());
  out.push(
    mk({
      id: "contact.portfolio",
      category: "contact",
      label: "Portfolio or GitHub",
      weight: 1,
      score: portfolio ? 1 : 0,
      message: portfolio
        ? "A portfolio or GitHub link is present."
        : "No GitHub or personal site. For remote technical roles this is expected.",
      fix: "Add github.com/yourname or your portfolio domain.",
    })
  );

  return out;
}

function structureChecks(cv: CVData): AtsCheck[] {
  const out: AtsCheck[] = [];
  const visible = cv.sections.filter((s) => s.visible).map((s) => s.key);

  out.push(
    mk({
      id: "structure.title",
      category: "structure",
      label: "Target job title",
      weight: 3,
      score: cv.personal.title.trim() ? 1 : 0,
      message: cv.personal.title
        ? `Headline reads "${cv.personal.title}".`
        : "No job title under your name.",
      fix: "Match the exact title from the posting, e.g. \"Senior Frontend Engineer\".",
    })
  );

  const summaryWords = words(cv.summary).length;
  out.push(
    mk({
      id: "structure.summary",
      category: "structure",
      label: "Professional summary",
      weight: 3,
      score: !visible.includes("summary")
        ? 0
        : summaryWords >= 40 && summaryWords <= 110
          ? 1
          : summaryWords >= 20
            ? 0.6
            : summaryWords > 0
              ? 0.3
              : 0,
      message: summaryWords
        ? `Summary is ${summaryWords} words.`
        : "No professional summary.",
      fix: "Write 3–4 sentences (40–90 words): seniority, domain, strongest measurable result, and what you want next.",
    })
  );

  const filledExperience = cv.experience.filter(
    (e) => e.role.trim() && e.company.trim()
  );
  out.push(
    mk({
      id: "structure.experience",
      category: "structure",
      label: "Work experience entries",
      weight: 5,
      score: ramp(filledExperience.length, 0, 2),
      message: filledExperience.length
        ? `${filledExperience.length} complete role${filledExperience.length > 1 ? "s" : ""} listed.`
        : "No complete work experience entry. Every entry needs a role and a company.",
      fix: "Each role needs a job title, company, and start/end dates.",
    })
  );

  const filledEducation = cv.education.filter((e) => e.school.trim());
  out.push(
    mk({
      id: "structure.education",
      category: "structure",
      label: "Education",
      weight: 2,
      score: filledEducation.length ? 1 : 0,
      message: filledEducation.length
        ? "Education section is filled in."
        : "No education entry. Many ATS templates treat this field as required.",
      fix: "Add your highest degree with institution and years.",
    })
  );

  const skillItems = cv.skills.flatMap((g) => g.items);
  out.push(
    mk({
      id: "structure.skills",
      category: "structure",
      label: "Skills section",
      weight: 4,
      score: ramp(skillItems.length, 0, 10),
      message: skillItems.length
        ? `${skillItems.length} skills listed across ${cv.skills.length} group${cv.skills.length > 1 ? "s" : ""}.`
        : "No skills listed. Keyword scanners read this section first.",
      fix: "List 12–20 concrete skills grouped by type (Languages, Frameworks, Cloud, Tools).",
    })
  );

  const risky = cv.sections
    .filter((s) => s.visible)
    .map((s) => s.title)
    .concat(cv.customSections.map((c) => c.title))
    .filter((title) => RISKY_HEADINGS[normalize(title)]);

  out.push(
    mk({
      id: "structure.headings",
      category: "structure",
      label: "Standard section headings",
      weight: 3,
      score: risky.length ? 0 : 1,
      items: risky,
      message: risky.length
        ? `Non-standard heading${risky.length > 1 ? "s" : ""}: ${risky.join(", ")}.`
        : "All section headings use names parsers recognise.",
      fix: 'Use conventional labels: "Work Experience", "Education", "Skills", "Projects".',
    })
  );

  return out;
}

function contentChecks(cv: CVData): AtsCheck[] {
  const out: AtsCheck[] = [];
  const index = buildTextIndex(cv);
  const bullets = index.bullets;

  // --- Action verbs -----------------------------------------------------
  const weakOpeners = bullets.filter((b) => !ACTION_VERBS.has(leadingWord(b)));
  const verbRatio = bullets.length
    ? (bullets.length - weakOpeners.length) / bullets.length
    : 0;

  out.push(
    mk({
      id: "content.actionVerbs",
      category: "content",
      label: "Bullets open with an action verb",
      weight: 5,
      score: bullets.length ? ramp(verbRatio, 0.3, 0.9) : 0,
      items: weakOpeners.slice(0, 6),
      message: bullets.length
        ? `${bullets.length - weakOpeners.length} of ${bullets.length} bullets start with a strong verb.`
        : "No bullet points found under your roles.",
      fix: 'Open every bullet with a past-tense verb: Led, Built, Reduced, Migrated, Shipped.',
    })
  );

  // --- Quantified impact ------------------------------------------------
  const quantified = bullets.filter(isQuantified);
  const quantRatio = bullets.length ? quantified.length / bullets.length : 0;

  out.push(
    mk({
      id: "content.quantified",
      category: "content",
      label: "Measurable results",
      weight: 6,
      score: bullets.length ? ramp(quantRatio, 0.05, 0.5) : 0,
      items: bullets.filter((b) => !isQuantified(b)).slice(0, 6),
      message: bullets.length
        ? `${quantified.length} of ${bullets.length} bullets contain a number (${Math.round(quantRatio * 100)}%).`
        : "Nothing to measure yet.",
      fix: "Aim for half your bullets to carry a number: %, currency, volume, time saved, users served.",
    })
  );

  // --- Weak phrasing ----------------------------------------------------
  const lowerAll = normalize(bullets.join(" ") + " " + cv.summary);
  const foundWeak = WEAK_PHRASES.filter((w) => lowerAll.includes(w.phrase));

  out.push(
    mk({
      id: "content.weakPhrases",
      category: "content",
      label: "Filler phrases",
      weight: 4,
      score: foundWeak.length === 0 ? 1 : foundWeak.length <= 2 ? 0.5 : 0,
      items: foundWeak.map((w) => w.phrase),
      message: foundWeak.length
        ? `Found ${foundWeak.length} filler phrase${foundWeak.length > 1 ? "s" : ""}.`
        : "No filler phrases detected.",
      fix: foundWeak.length
        ? `${foundWeak[0].phrase} → ${foundWeak[0].fix}`
        : undefined,
    })
  );

  // --- First person -----------------------------------------------------
  const pronounHits = words(bullets.join(" ") + " " + cv.summary).filter((w) =>
    PRONOUNS.has(w)
  );

  out.push(
    mk({
      id: "content.pronouns",
      category: "content",
      label: "No first-person pronouns",
      weight: 3,
      score: pronounHits.length === 0 ? 1 : pronounHits.length <= 2 ? 0.5 : 0,
      items: [...new Set(pronounHits)],
      message: pronounHits.length
        ? `Uses first-person pronouns ${[...new Set(pronounHits)].join(", ")}.`
        : "Written in the implied first person, as convention expects.",
      fix: 'Drop "I" and "we": "I led a team of 5" becomes "Led a team of 5".',
    })
  );

  // --- Bullet length ----------------------------------------------------
  const tooLong = bullets.filter((b) => words(b).length > 34);
  const tooShort = bullets.filter((b) => words(b).length > 0 && words(b).length < 8);
  const offLength = tooLong.length + tooShort.length;

  out.push(
    mk({
      id: "content.bulletLength",
      category: "content",
      label: "Bullet length",
      weight: 3,
      score: bullets.length ? 1 - clamp01(offLength / bullets.length) : 0,
      items: [...tooLong, ...tooShort].slice(0, 6),
      message: offLength
        ? `${offLength} bullet${offLength > 1 ? "s are" : " is"} outside the readable 8–34 word range.`
        : "Bullet lengths are consistent and scannable.",
      fix: "One or two lines each. Split anything longer into two bullets.",
    })
  );

  // --- Bullets per role -------------------------------------------------
  const rolesWithFewBullets = cv.experience
    .filter((e) => e.role.trim() || e.company.trim())
    .filter((e) => e.bullets.filter((b) => b.trim()).length < 3)
    .map((e) => `${e.role || "Untitled role"} — ${e.company || "?"}`);

  out.push(
    mk({
      id: "content.bulletsPerRole",
      category: "content",
      label: "Depth per role",
      weight: 3,
      score: cv.experience.length
        ? 1 - clamp01(rolesWithFewBullets.length / cv.experience.length)
        : 0,
      items: rolesWithFewBullets,
      message: rolesWithFewBullets.length
        ? `${rolesWithFewBullets.length} role${rolesWithFewBullets.length > 1 ? "s have" : " has"} fewer than 3 bullets.`
        : "Every role is described in enough depth.",
      fix: "3–6 bullets for recent roles, 2–3 for older ones.",
    })
  );

  // --- Repetition -------------------------------------------------------
  const openers = bullets.map(leadingWord).filter(Boolean);
  const counts = new Map<string, number>();
  for (const o of openers) counts.set(o, (counts.get(o) ?? 0) + 1);
  const repeated = [...counts.entries()].filter(([, n]) => n >= 3);

  out.push(
    mk({
      id: "content.variety",
      category: "content",
      label: "Verb variety",
      weight: 2,
      score: repeated.length === 0 ? 1 : repeated.length === 1 ? 0.6 : 0.2,
      items: repeated.map(([verb, n]) => `${verb} (${n}×)`),
      message: repeated.length
        ? `Repeated opening verb${repeated.length > 1 ? "s" : ""}: ${repeated.map(([v, n]) => `"${v}" ${n}×`).join(", ")}.`
        : "Opening verbs are varied.",
      fix: "Reuse an opening verb at most twice across the whole document.",
    })
  );

  // --- Tech stack per role ---------------------------------------------
  const rolesMissingTech = cv.experience
    .filter((e) => e.role.trim())
    .filter((e) => e.tech.length === 0)
    .map((e) => `${e.role} — ${e.company || "?"}`);

  out.push(
    mk({
      id: "content.techPerRole",
      category: "content",
      label: "Tools listed per role",
      weight: 2,
      score: cv.experience.length
        ? 1 - clamp01(rolesMissingTech.length / cv.experience.length)
        : 0,
      items: rolesMissingTech,
      message: rolesMissingTech.length
        ? `${rolesMissingTech.length} role${rolesMissingTech.length > 1 ? "s list" : " lists"} no tools.`
        : "Each role names the stack you used.",
      fix: "Naming the stack per role lets a scanner tie a keyword to recent, dated experience.",
    })
  );

  return out;
}

function keywordChecks(cv: CVData): AtsCheck[] {
  const out: AtsCheck[] = [];
  const index = buildTextIndex(cv);

  const canonicalSkills = new Set(index.skills.map(canonicalize));
  const hardSkills = [...canonicalSkills].filter(
    (s) => !SOFT_SKILLS.has(s)
  );

  out.push(
    mk({
      id: "keywords.hardSkills",
      category: "keywords",
      label: "Hard skill coverage",
      weight: 5,
      score: ramp(hardSkills.length, 3, 14),
      message: `${hardSkills.length} distinct hard skills detected.`,
      fix: "Target 12–20 concrete tools, languages and platforms. Scanners match on nouns, not adjectives.",
    })
  );

  const softOnly = [...canonicalSkills].filter((s) => SOFT_SKILLS.has(s));
  const softRatio = canonicalSkills.size ? softOnly.length / canonicalSkills.size : 0;

  out.push(
    mk({
      id: "keywords.softBalance",
      category: "keywords",
      label: "Hard vs soft skill balance",
      weight: 3,
      score: canonicalSkills.size ? 1 - clamp01((softRatio - 0.25) / 0.45) : 0,
      items: softOnly,
      message: canonicalSkills.size
        ? `${Math.round(softRatio * 100)}% of your listed skills are soft skills.`
        : "No skills to balance yet.",
      fix: "Keep soft skills under a quarter of the list and prove them in bullets instead.",
    })
  );

  const title = normalize(cv.personal.title || cv.meta.targetRole);
  const titleTokens = title.split(" ").filter((t) => t.length > 3);
  const titleHits = titleTokens.filter((t) =>
    index.tokens.filter((w) => w === t).length >= 2
  );

  out.push(
    mk({
      id: "keywords.titleEcho",
      category: "keywords",
      label: "Target title reinforced",
      weight: 4,
      score: !titleTokens.length
        ? 0
        : ramp(titleHits.length / titleTokens.length, 0.2, 0.8),
      message: titleTokens.length
        ? `${titleHits.length} of ${titleTokens.length} words from your target title also appear in the body.`
        : "Set a target job title first.",
      fix: "The title should reappear naturally in your summary and in at least one role.",
    })
  );

  const skillsInBullets = [...canonicalSkills].filter((s) =>
    normalize(index.bullets.join(" ")).includes(s)
  );
  const contextRatio = canonicalSkills.size
    ? skillsInBullets.length / canonicalSkills.size
    : 0;

  out.push(
    mk({
      id: "keywords.context",
      category: "keywords",
      label: "Skills backed by evidence",
      weight: 4,
      score: canonicalSkills.size ? ramp(contextRatio, 0.1, 0.55) : 0,
      items: [...canonicalSkills]
        .filter((s) => !skillsInBullets.includes(s))
        .slice(0, 8),
      message: canonicalSkills.size
        ? `${skillsInBullets.length} of ${canonicalSkills.size} listed skills also appear in your bullets.`
        : "Add skills first.",
      fix: "A skill that appears only in a list reads as unproven. Reference the important ones inside a result.",
    })
  );

  return out;
}

function formattingChecks(cv: CVData): AtsCheck[] {
  const out: AtsCheck[] = [];

  // --- Dates present ----------------------------------------------------
  const datedRoles = cv.experience.filter((e) => e.role.trim() || e.company.trim());
  const missingDates = datedRoles.filter(
    (e) => parseMonth(e.startDate) === null || (!e.current && parseMonth(e.endDate) === null)
  );

  out.push(
    mk({
      id: "format.dates",
      category: "formatting",
      label: "Machine-readable dates",
      weight: 5,
      score: datedRoles.length
        ? 1 - clamp01(missingDates.length / datedRoles.length)
        : 0,
      items: missingDates.map((e) => `${e.role || "Untitled"} — ${e.company || "?"}`),
      message: missingDates.length
        ? `${missingDates.length} role${missingDates.length > 1 ? "s are" : " is"} missing a parseable start or end date.`
        : datedRoles.length
          ? "All roles carry complete dates."
          : "No dated roles yet.",
      fix: "Use the month pickers so dates export as a consistent MMM YYYY range.",
    })
  );

  // --- Reverse chronological -------------------------------------------
  const starts = cv.experience
    .map((e) => parseMonth(e.startDate))
    .filter((v): v is number => v !== null);
  const isDescending = starts.every((v, i) => i === 0 || starts[i - 1] >= v);

  out.push(
    mk({
      id: "format.order",
      category: "formatting",
      label: "Reverse chronological order",
      weight: 3,
      score: starts.length < 2 ? 1 : isDescending ? 1 : 0,
      message: isDescending
        ? "Roles run newest to oldest, which is what parsers assume."
        : "Roles are out of order.",
      fix: "Drag your most recent role to the top.",
    })
  );

  // --- Employment gaps --------------------------------------------------
  const spans = experienceSpans(cv);
  const gaps: string[] = [];
  for (let i = 1; i < spans.length; i++) {
    const gap = spans[i].start - spans[i - 1].end;
    if (gap >= 7) {
      gaps.push(`${Math.round(gap)} months before ${spans[i].label}`);
    }
  }

  out.push(
    mk({
      id: "format.gaps",
      category: "formatting",
      label: "Timeline gaps",
      weight: 2,
      score: gaps.length === 0 ? 1 : gaps.length === 1 ? 0.6 : 0.3,
      items: gaps,
      message: gaps.length
        ? `${gaps.length} gap${gaps.length > 1 ? "s" : ""} longer than six months.`
        : "No unexplained gaps in the timeline.",
      fix: "Cover long gaps with freelance work, study or a project entry so a screener doesn't guess.",
    })
  );

  // --- Parser-hostile characters ---------------------------------------
  const index = buildTextIndex(cv);
  const hasRisky = RISKY_CHARACTERS.test(index.full);

  out.push(
    mk({
      id: "format.characters",
      category: "formatting",
      label: "Plain-text safe characters",
      weight: 3,
      score: hasRisky ? 0 : 1,
      message: hasRisky
        ? "Emoji or decorative bullet glyphs found in your text."
        : "No emoji or glyphs that garble in text extraction.",
      fix: "Remove emoji and typed bullet characters — the template adds real bullets on export.",
    })
  );

  // --- Link formatting --------------------------------------------------
  const p = cv.personal;
  const badLinks = [p.website, p.linkedin, p.github]
    .filter(Boolean)
    .filter((l) => /\s/.test(l) || l.length > 90);

  out.push(
    mk({
      id: "format.links",
      category: "formatting",
      label: "Clean URLs",
      weight: 1,
      score: badLinks.length ? 0.3 : 1,
      items: badLinks,
      message: badLinks.length
        ? "Some links contain spaces or are unusually long."
        : "Links are short and clean.",
      fix: "Strip https:// and tracking parameters: linkedin.com/in/yourname.",
    })
  );

  return out;
}

function lengthChecks(cv: CVData, pages: number, wordCount: number): AtsCheck[] {
  const out: AtsCheck[] = [];
  const years = totalMonths(experienceSpans(cv)) / 12;
  const idealMax = years >= 10 ? 2 : 1.05;

  let pageScore: number;
  if (pages === 0) pageScore = 0;
  else if (pages <= idealMax) pageScore = 1;
  else if (pages <= idealMax + 0.35) pageScore = 0.65;
  else if (pages <= 2.1) pageScore = 0.4;
  else pageScore = 0.1;

  out.push(
    mk({
      id: "length.pages",
      category: "length",
      label: "Page count",
      weight: 6,
      score: pageScore,
      message: `Estimated ${pages} page${pages === 1 ? "" : "s"} at the current font and spacing.`,
      fix:
        years >= 10
          ? "With 10+ years, two pages is fine. Anything past that gets skimmed."
          : "Under 10 years of experience, keep it to a single page. Trim the oldest role first.",
    })
  );

  out.push(
    mk({
      id: "length.words",
      category: "length",
      label: "Word count",
      weight: 4,
      score:
        wordCount >= 350 && wordCount <= 850
          ? 1
          : wordCount >= 250 && wordCount <= 1000
            ? 0.6
            : wordCount > 0
              ? 0.25
              : 0,
      message: `${wordCount} words total.`,
      fix: "400–800 words is the sweet spot: enough keywords to match, short enough to read in 30 seconds.",
    })
  );

  const emptyEntries =
    cv.experience.filter((e) => !e.role.trim() && !e.company.trim()).length +
    cv.education.filter((e) => !e.school.trim() && !e.degree.trim()).length +
    cv.projects.filter((p) => !p.name.trim()).length;

  out.push(
    mk({
      id: "length.empty",
      category: "length",
      label: "No blank entries",
      weight: 2,
      score: emptyEntries === 0 ? 1 : 0,
      message: emptyEntries
        ? `${emptyEntries} empty entr${emptyEntries > 1 ? "ies" : "y"} will export as blank rows.`
        : "No empty entries.",
      fix: "Delete unused entries so they don't render as gaps in the PDF.",
    })
  );

  return out;
}

// -----------------------------------------------------------------------------

function grade(score: number): AtsReport["grade"] {
  if (score >= 90) return "A";
  if (score >= 78) return "B";
  if (score >= 62) return "C";
  if (score >= 45) return "D";
  return "F";
}

function headlineFor(score: number, weakest: CategoryScore | undefined): string {
  if (score >= 90) {
    return "Ready to submit. This parses cleanly and reads well to a human.";
  }
  if (score >= 78) {
    return `Strong. Tighten ${weakest ? weakest.label.toLowerCase() : "the remaining warnings"} to clear 90.`;
  }
  if (score >= 62) {
    return `Solid base with real gaps — ${weakest ? weakest.label.toLowerCase() : "several areas"} needs work before you apply.`;
  }
  if (score >= 45) {
    return "This will lose points in automated screening. Work through the failed checks below.";
  }
  return "Most screeners would drop this. Start with contact details and work experience.";
}

/**
 * Scores a CV on ATS parseability and recruiter readability.
 *
 * Pure and synchronous, so the editor can run it on every keystroke and the
 * API can run the same code server-side for stored scores.
 */
export function scoreCV(cv: CVData): AtsReport {
  const index = buildTextIndex(cv);
  const pages = estimatePages(cv);

  const checks: AtsCheck[] = [
    ...contactChecks(cv),
    ...structureChecks(cv),
    ...contentChecks(cv),
    ...keywordChecks(cv),
    ...formattingChecks(cv),
    ...lengthChecks(cv, pages, index.wordCount),
  ];

  const categories: CategoryScore[] = (
    Object.keys(CATEGORY_WEIGHTS) as CheckCategory[]
  ).map((key) => {
    const group = checks.filter((c) => c.category === key);
    const totalWeight = group.reduce((sum, c) => sum + c.weight, 0);
    const achieved = group.reduce((sum, c) => sum + c.score * c.weight, 0);
    const ratio = totalWeight ? achieved / totalWeight : 0;
    return {
      key,
      label: CATEGORY_LABELS[key],
      weight: CATEGORY_WEIGHTS[key],
      score: Math.round(ratio * 100),
      earned: Math.round(ratio * CATEGORY_WEIGHTS[key] * 10) / 10,
    };
  });

  const score = Math.round(
    categories.reduce((sum, c) => sum + c.earned, 0)
  );

  const weakest = [...categories].sort((a, b) => a.score - b.score)[0];

  const canonicalSkills = new Set(index.skills.map(canonicalize));

  return {
    score: Math.max(0, Math.min(100, score)),
    grade: grade(score),
    headline: headlineFor(score, weakest),
    categories,
    checks,
    stats: {
      wordCount: index.wordCount,
      bulletCount: index.bullets.length,
      quantifiedBullets: index.bullets.filter(isQuantified).length,
      actionVerbBullets: index.bullets.filter((b) =>
        ACTION_VERBS.has(leadingWord(b))
      ).length,
      skillCount: canonicalSkills.size,
      hardSkillCount: [...canonicalSkills].filter((s) => !SOFT_SKILLS.has(s))
        .length,
      estimatedPages: pages,
      totalExperienceMonths: totalMonths(experienceSpans(cv)),
    },
    generatedAt: Date.now(),
  };
}
