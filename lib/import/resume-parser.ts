import type { CVData, SectionKey } from "@/types/cv";
import { emptyCV } from "@/lib/cv/defaults";
import { uid } from "@/lib/uid";

/**
 * Heuristic resume parser.
 *
 * Extracted text has no structure, so this recovers what it reliably can —
 * contact details, section boundaries, dated entries and bullets — and reports
 * confidence so the UI can tell the user what to double-check. It is a
 * time-saver for re-typing, not a source of truth.
 */

export interface ParseResult {
  cv: CVData;
  confidence: number;
  warnings: string[];
  /** Text that didn't map to any known section. */
  unmatched: string[];
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/in\/[\w%-]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|net|org|io|dev|co|me|app|az|xyz)(?:\/[\w\-./?%&=]*)?/i;

const BULLET_RE = /^[\s]*[•▪◦‣·*\-–—]\s+/;
const PAGE_MARKER_RE = /^--\s*\d+\s+of\s+\d+\s*--$/i;
const TECH_LINE_RE = /^tech(?:nologies)?\s*:\s*(.+)$/i;

/** Month-year token — includes European MM.YYYY used in many CVs. */
const DATE_TOKEN =
  "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s*'?\\d{2,4}|\\d{1,2}\\/\\d{4}|\\d{1,2}\\.\\d{4}|\\d{4}";

/** Month-year ranges in the formats resumes actually use. */
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*[-–—to]+\\s*(${DATE_TOKEN}|present|current|now)`,
  "i"
);

const COLLAPSED_SECTIONS: Record<string, SectionKey> = {
  summary: "summary",
  profile: "summary",
  objective: "summary",
  skills: "skills",
  competencies: "skills",
  experience: "experience",
  workexperience: "experience",
  employment: "experience",
  projects: "projects",
  education: "education",
  certifications: "certifications",
  languages: "languages",
  awards: "awards",
};

const TITLE_START_RE =
  /(Senior|Junior|Lead|Staff|Principal|Frontend|Backend|Full[\s-]?Stack|Software|Developer|Engineer|Architect|Manager|Designer|Consultant|DevOps|Data|Product|Project|Technical|Chief|Head|VP|Director|Associate|Intern)/i;

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const SECTION_PATTERNS: { key: SectionKey; patterns: RegExp }[] = [
  { key: "summary", patterns: /^(professional\s+)?(summary|profile|objective|about( me)?|overview)$/i },
  { key: "skills", patterns: /^(technical\s+|core\s+|key\s+)?(skills|competencies|technologies|tech stack|expertise)$/i },
  { key: "experience", patterns: /^(work|professional|employment|relevant)?\s*(experience|history|employment)$/i },
  { key: "projects", patterns: /^(personal\s+|side\s+|selected\s+)?projects?$/i },
  { key: "education", patterns: /^(education|academic background|qualifications)$/i },
  { key: "certifications", patterns: /^(certifications?|licenses?|courses?|training)$/i },
  { key: "awards", patterns: /^(awards?|achievements?|honors?|honours?|recognition)$/i },
  { key: "languages", patterns: /^languages?$/i },
];

interface Chunk {
  key: SectionKey | "header" | "unknown";
  heading: string;
  lines: string[];
}

function collapseSpacedLetters(line: string): string | null {
  const trimmed = line.trim();
  if (!/^(\S\s+)+\S$/.test(trimmed) || trimmed.length > 60) return null;
  return trimmed.replace(/\s+/g, "").toLowerCase();
}

function preprocessText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .replace(/^--\s*\d+\s+of\s+\d+\s*--\s*$/gim, "");
}

function detectSection(line: string): SectionKey | null {
  const cleaned = line.trim().replace(/[:\s]+$/, "");
  if (cleaned.length > 60) return null;

  const collapsed = collapseSpacedLetters(cleaned);
  if (collapsed && COLLAPSED_SECTIONS[collapsed]) {
    return COLLAPSED_SECTIONS[collapsed];
  }

  for (const { key, patterns } of SECTION_PATTERNS) {
    if (patterns.test(cleaned)) return key;
    if (patterns.test(cleaned.replace(/\s+/g, ""))) return key;
  }
  return null;
}

function chunkByHeading(lines: string[]): Chunk[] {
  const chunks: Chunk[] = [{ key: "header", heading: "", lines: [] }];

  for (const line of lines) {
    const section = detectSection(line);
    if (section) {
      chunks.push({ key: section, heading: line.trim(), lines: [] });
    } else {
      chunks[chunks.length - 1].lines.push(line);
    }
  }

  return chunks;
}

/** "Mar 2020" / "03/2020" / "2020" -> "2020-03". */
function toMonthValue(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (/^(present|current|now)$/.test(value)) return "";

  const slash = /^(\d{1,2})\/(\d{4})$/.exec(value);
  if (slash) return `${slash[2]}-${slash[1].padStart(2, "0")}`;

  const dotted = /^(\d{1,2})\.(\d{4})$/.exec(value);
  if (dotted) return `${dotted[2]}-${dotted[1].padStart(2, "0")}`;

  const monthYear = /^([a-z]{3})[a-z]*\.?\s*'?(\d{2,4})$/.exec(value);
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1]];
    let year = Number(monthYear[2]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    if (month) return `${year}-${String(month).padStart(2, "0")}`;
  }

  const yearOnly = /^(\d{4})$/.exec(value);
  if (yearOnly) return `${yearOnly[1]}-01`;

  return "";
}

function parseContact(lines: string[]) {
  const blob = lines.join("\n");
  const email = EMAIL_RE.exec(blob)?.[0] ?? "";
  const linkedin = LINKEDIN_RE.exec(blob)?.[0] ?? "";
  const github = GITHUB_RE.exec(blob)?.[0] ?? "";

  // Most resumes put the phone on the same line as the email, so the addresses
  // and URLs are stripped out first rather than skipping the whole line —
  // otherwise "info2024@x.com" would be read as a phone number.
  let phone = "";
  for (const line of lines) {
    const stripped = line
      .replace(new RegExp(EMAIL_RE.source, "gi"), " ")
      .replace(new RegExp(URL_RE.source, "gi"), " ");

    const hit = PHONE_RE.exec(stripped);
    if (hit && hit[0].replace(/\D/g, "").length >= 8) {
      phone = hit[0].trim();
      break;
    }
  }

  let website = "";
  const emailDomain = email.includes("@") ? email.split("@")[1]?.toLowerCase() : "";
  for (const line of lines) {
    const hit = URL_RE.exec(line);
    if (!hit) continue;
    const url = hit[0];
    if (LINKEDIN_RE.test(url) || GITHUB_RE.test(url) || url.includes("@")) continue;
    if (emailDomain && url.toLowerCase().includes(emailDomain)) continue;
    website = url;
    break;
  }

  // Name: first line that reads like a person's name.
  let fullName = "";
  let title = "";
  for (const line of lines.slice(0, 6)) {
    const t = line.trim();
    if (!t || t.length > 80) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || URL_RE.test(t)) continue;

    const merged = splitMergedNameTitle(t);
    if (merged.fullName && merged.title) {
      fullName = merged.fullName;
      title = merged.title;
      break;
    }

    const wordCount = t.split(/\s+/).length;
    if (!fullName && wordCount >= 2 && wordCount <= 4 && /^[\p{L}\s.'-]+$/u.test(t)) {
      fullName = t;
      continue;
    }
    if (fullName && !title && wordCount <= 8) {
      title = t;
      break;
    }
  }

  let location = "";
  for (const line of lines.slice(0, 8)) {
    const hit = /([\p{Lu}][\p{L}'-]+(?:\s[\p{Lu}][\p{L}'-]+)*),\s*([\p{Lu}][\p{L}'-]+)/u.exec(line);
    if (hit && !EMAIL_RE.test(line) && hit[0].length < 50 && hit[0] !== fullName) {
      location = hit[0];
      break;
    }
  }

  return { fullName, title, email, phone, location, website, linkedin, github };
}

function splitMergedNameTitle(line: string): { fullName: string; title: string } {
  const match = TITLE_START_RE.exec(line);
  if (!match || match.index < 3) return { fullName: "", title: "" };
  return {
    fullName: line.slice(0, match.index).trim(),
    title: line.slice(match.index).trim(),
  };
}

function parseSkills(lines: string[]) {
  const groups: { id: string; category: string; items: string[] }[] = [];

  for (const line of lines) {
    const cleaned = line.replace(BULLET_RE, "").trim();
    if (!cleaned) continue;

    const labelled = /^([\p{L}\s&/+#.-]{2,40}?)\s*[:–—-]\s*(.+)$/u.exec(cleaned);
    if (labelled) {
      const items = splitSkillList(labelled[2]);
      if (items.length) {
        groups.push({ id: uid(), category: labelled[1].trim(), items });
        continue;
      }
    }

    const categoryPipe =
      /^([\p{L}\s&/+#.-]{2,35})\s+((?:[^|]+\|\s*){1,}[^|]+)$/u.exec(cleaned);
    if (categoryPipe) {
      const items = splitSkillList(categoryPipe[2]);
      if (items.length) {
        groups.push({ id: uid(), category: categoryPipe[1].trim(), items });
        continue;
      }
    }

    const items = splitSkillList(cleaned);
    if (items.length >= 2) {
      groups.push({ id: uid(), category: "Skills", items });
    }
  }

  // Merge repeated "Skills" buckets so the result isn't a list of one-liners.
  const merged = new Map<string, string[]>();
  for (const g of groups) {
    const existing = merged.get(g.category) ?? [];
    merged.set(g.category, [...existing, ...g.items]);
  }

  return [...merged.entries()].map(([category, items]) => ({
    id: uid(),
    category,
    items: [...new Set(items)].slice(0, 30),
  }));
}

function splitSkillList(value: string): string[] {
  return value
    .split(/[,|;•·]+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s.length > 1 && s.length < 40);
}

interface DatedEntry {
  headerLines: string[];
  bullets: string[];
  tech: string[];
  start: string;
  end: string;
  current: boolean;
}

/** Splits a block into entries, treating each date range as an entry boundary. */
function splitDatedEntries(lines: string[]): DatedEntry[] {
  const entries: DatedEntry[] = [];
  let current: DatedEntry | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isBullet = BULLET_RE.test(line);
    const dateMatch = !isBullet ? DATE_RANGE_RE.exec(trimmed) : null;

    if (dateMatch) {
      const endRaw = dateMatch[2].toLowerCase();
      current = {
        headerLines: [trimmed.replace(dateMatch[0], "").trim()].filter(Boolean),
        bullets: [],
        tech: [],
        start: toMonthValue(dateMatch[1]),
        end: toMonthValue(dateMatch[2]),
        current: /present|current|now/.test(endRaw),
      };
      entries.push(current);
      continue;
    }

    if (!current) {
      current = {
        headerLines: [],
        bullets: [],
        tech: [],
        start: "",
        end: "",
        current: false,
      };
      entries.push(current);
    }

    if (isBullet) {
      current.bullets.push(trimmed.replace(BULLET_RE, "").trim());
    } else if (TECH_LINE_RE.test(trimmed)) {
      const techItems = splitSkillList(TECH_LINE_RE.exec(trimmed)?.[1] ?? "");
      if (techItems.length) current.tech = techItems;
    } else if (current.bullets.length) {
      // Continuation of the previous bullet after a line wrap.
      current.bullets[current.bullets.length - 1] += ` ${trimmed}`;
    } else if (current.headerLines.length < 3) {
      current.headerLines.push(trimmed);
    } else {
      current.bullets.push(trimmed);
    }
  }

  return entries.filter((e) => e.headerLines.length || e.bullets.length);
}

/** "Senior Engineer at Acme" / "Senior Engineer | Acme" -> [role, company] */
function splitRoleCompany(line: string): [string, string] {
  const parts = line.split(/\s+(?:at|@|\||–|—|,)\s+/i);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(", ").trim()];
  }
  return [line.trim(), ""];
}

export function parseResumeText(text: string, fallbackName = "Imported CV"): ParseResult {
  const warnings: string[] = [];
  const unmatched: string[] = [];

  const lines = preprocessText(text)
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .filter((l, i, arr) => l.trim() || (arr[i - 1]?.trim() ?? ""));

  if (lines.filter((l) => l.trim()).length < 8) {
    warnings.push(
      "Almost no text was extracted. If this is a scanned or image-based PDF, it needs OCR before it can be read."
    );
  }

  const chunks = chunkByHeading(lines);
  const cv = emptyCV(fallbackName);
  cv.experience = [];
  cv.education = [];
  cv.skills = [];

  const headerChunk = chunks.find((c) => c.key === "header");
  const contact = parseContact(headerChunk?.lines ?? lines.slice(0, 12));
  cv.personal = { ...cv.personal, ...contact };
  if (contact.title) cv.meta.targetRole = contact.title;

  let matchedSections = 0;

  for (const chunk of chunks) {
    const body = chunk.lines.filter((l) => l.trim());
    if (!body.length) continue;

    switch (chunk.key) {
      case "summary":
        cv.summary = body.join(" ").replace(/\s+/g, " ").trim();
        matchedSections++;
        break;

      case "skills":
        cv.skills = parseSkills(body);
        matchedSections++;
        break;

      case "experience": {
        for (const entry of splitDatedEntries(body)) {
          const [role, company] = splitRoleCompany(entry.headerLines[0] ?? "");
          cv.experience.push({
            id: uid(),
            role,
            company: company || entry.headerLines[1] || "",
            location: "",
            employmentType: "",
            startDate: entry.start,
            endDate: entry.end,
            current: entry.current,
            bullets: entry.bullets.length ? entry.bullets : [""],
            tech: entry.tech,
          });
        }
        matchedSections++;
        break;
      }

      case "projects": {
        for (const entry of splitDatedEntries(body)) {
          cv.projects.push({
            id: uid(),
            name: entry.headerLines[0] ?? "",
            role: "",
            link: URL_RE.exec(entry.headerLines.join(" "))?.[0] ?? "",
            startDate: entry.start,
            endDate: entry.end,
            description: entry.headerLines.slice(1).join(" "),
            bullets: entry.bullets,
            tech: [],
          });
        }
        matchedSections++;
        break;
      }

      case "education": {
        for (const entry of splitDatedEntries(body)) {
          const [degree, school] = splitRoleCompany(entry.headerLines[0] ?? "");
          cv.education.push({
            id: uid(),
            degree,
            field: "",
            school: school || entry.headerLines[1] || "",
            location: "",
            startDate: entry.start,
            endDate: entry.end,
            current: entry.current,
            gpa: /gpa[:\s]*([\d.]+)/i.exec(body.join(" "))?.[1] ?? "",
            details: entry.bullets.join(" "),
          });
        }
        matchedSections++;
        break;
      }

      case "certifications": {
        for (const line of body) {
          const cleaned = line.replace(BULLET_RE, "").trim();
          if (!cleaned) continue;
          const [name, issuer] = splitRoleCompany(cleaned);
          cv.certifications.push({
            id: uid(),
            name,
            issuer,
            issueDate: toMonthValue(/(\d{4})/.exec(cleaned)?.[1] ?? ""),
            expiryDate: "",
            credentialId: "",
            url: "",
          });
        }
        matchedSections++;
        break;
      }

      case "awards": {
        for (const line of body) {
          const cleaned = line.replace(BULLET_RE, "").trim();
          if (!cleaned) continue;
          cv.awards.push({
            id: uid(),
            title: cleaned,
            issuer: "",
            date: "",
            description: "",
          });
        }
        matchedSections++;
        break;
      }

      case "languages": {
        for (const line of body) {
          const cleaned = line.replace(BULLET_RE, "").trim();
          if (!cleaned) continue;

          const emDash = /^([\p{L}\s]+?)\s*[-–—]\s*(.+)$/u.exec(cleaned);
          if (emDash) {
            cv.languages.push({
              id: uid(),
              name: emDash[1].trim(),
              level: normalizeLevel(emDash[2].trim()),
            });
            continue;
          }

          for (const part of line.split(/[,;|•·]+/)) {
            const partClean = part.replace(BULLET_RE, "").trim();
            if (!partClean) continue;
            const named = /^([\p{L}\s]+?)\s*[-–(:]\s*([\p{L}\d\s]+)\)?$/u.exec(partClean);
            cv.languages.push({
              id: uid(),
              name: (named?.[1] ?? partClean).trim(),
              level: normalizeLevel(named?.[2] ?? ""),
            });
          }
        }
        matchedSections++;
        break;
      }

      case "header":
        break;

      default:
        unmatched.push(...body);
    }
  }

  if (!cv.experience.length) {
    cv.experience = [
      {
        id: uid(),
        role: "",
        company: "",
        location: "",
        employmentType: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [""],
        tech: [],
      },
    ];
    warnings.push("No work experience section was recognised — add your roles manually.");
  }
  if (!cv.skills.length) {
    warnings.push("No skills section was recognised. Add one; it is the first thing keyword scanners read.");
  }
  if (!contact.email) warnings.push("No email address was found in the file.");
  if (!contact.fullName) warnings.push("Could not confidently identify your name.");

  const confidence = Math.round(
    Math.min(
      100,
      matchedSections * 12 +
        (contact.email ? 12 : 0) +
        (contact.fullName ? 12 : 0) +
        (cv.experience.some((e) => e.role) ? 16 : 0)
    )
  );

  cv.name = contact.fullName ? `${contact.fullName} — Imported` : fallbackName;
  cv.updatedAt = Date.now();

  return { cv, confidence, warnings, unmatched: unmatched.slice(0, 40) };
}

function normalizeLevel(raw: string): CVData["languages"][number]["level"] {
  const v = raw.trim().toUpperCase();
  if (!v) return "B2";
  if (["A1", "A2", "B1", "B2", "C1", "C2"].includes(v)) {
    return v as CVData["languages"][number]["level"];
  }
  if (v.includes("PROFESSIONAL") || v.includes("WORKING")) return "C1";
  if (v.includes("NATIVE") || v.includes("MOTHER") || v.includes("BILINGUAL")) return "Native";
  if (v.includes("FLUENT") || v.includes("ADVANCED")) return "C1";
  if (v.includes("INTERMEDIATE")) return "B1";
  if (v.includes("BASIC") || v.includes("BEGINNER") || v.includes("ELEMENTARY")) return "A1";
  return "B2";
}
