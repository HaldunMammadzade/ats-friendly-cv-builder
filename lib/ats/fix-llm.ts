import "server-only";

import type { CVData } from "@/types/cv";
import type { AtsCheck } from "./score";
import { scoreCV } from "./score";
import { applySmartQuantification } from "./fix-metrics";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export interface AtsFixPatch {
  summary?: string;
  personal?: Partial<CVData["personal"]>;
  skills?: CVData["skills"];
  experience?: Pick<CVData["experience"][number], "id" | "bullets" | "tech">[];
}

const SYSTEM = `You are a senior resume editor optimizing CVs for ATS parsers and human recruiters.

Return ONLY valid JSON matching this schema:
{
  "summary": string | null,
  "personal": { "title"?, "location"?, "linkedin"?, "github"?, "website"? } | null,
  "skills": [{ "id": string, "category": string, "items": string[] }] | null,
  "experience": [{ "id": string, "bullets": string[], "tech": string[] }] | null
}

Rules:
1. Use ONLY facts present in CV_FACTS — never invent employers, schools, dates, or credentials.
2. Metrics: keep numbers already in the CV; convert word forms ("thousands" -> "1,000+"); do NOT fabricate new percentages.
3. Bullets: past tense, strong action verb first, no "I/we", 12–32 words, one idea each, no placeholders.
4. Only include fields needed to fix the ATS_CHECK described.
5. Preserve experience entry IDs exactly.
6. American English. Professional tone.`;

function cvFacts(cv: CVData) {
  return {
    personal: cv.personal,
    meta: cv.meta,
    summary: cv.summary,
    skills: cv.skills,
    experience: cv.experience.map((e) => ({
      id: e.id,
      role: e.role,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      bullets: e.bullets,
      tech: e.tech,
    })),
    education: cv.education,
  };
}

function parseJson(raw: string): AtsFixPatch | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as AtsFixPatch;
  } catch {
    return null;
  }
}

function applyPatch(cv: CVData, patch: AtsFixPatch): CVData {
  const next = structuredClone(cv);
  if (patch.summary) next.summary = patch.summary.trim();
  if (patch.personal) next.personal = { ...next.personal, ...patch.personal };
  if (patch.skills?.length) next.skills = patch.skills;
  if (patch.experience?.length) {
    for (const upd of patch.experience) {
      const exp = next.experience.find((e) => e.id === upd.id);
      if (!exp) continue;
      if (upd.bullets?.length) exp.bullets = upd.bullets.map((b) => b.trim()).filter(Boolean);
      if (upd.tech?.length) exp.tech = upd.tech.filter(Boolean).slice(0, 12);
    }
  }
  next.updatedAt = Date.now();
  return next;
}

function checkImproved(before: AtsCheck, afterReport: ReturnType<typeof scoreCV>): boolean {
  const after = afterReport.checks.find((c) => c.id === before.id);
  if (!after) return false;
  return after.score > before.score || after.status === "pass";
}

export async function enhanceCvWithLlm(cv: CVData, check: AtsCheck): Promise<CVData | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const quantifiedExtra =
    check.id === "content.quantified"
      ? `\nSPECIAL INSTRUCTIONS for measurable results:
- Rewrite ONLY bullets listed in ATS_CHECK.items (or unquantified bullets if items empty).
- Each bullet must get a DIFFERENT metric clause — never repeat the same number, %, or phrase twice.
- Use numbers already present in CV_FACTS; derive counts from tech arrays, date ranges, or list lengths when needed.
- Do NOT copy one achievement's metric into unrelated bullets.
- Prefer: percentages, user counts, time saved, modules/features count, team size — only when supported by facts.
- Return experience patches only for entries you changed.`
      : "";

  const userPrompt = `ATS_CHECK:\n${JSON.stringify({ id: check.id, label: check.label, message: check.message, fix: check.fix, items: check.items }, null, 2)}\n\nCV_FACTS:\n${JSON.stringify(cvFacts(cv), null, 2)}\n\nJOB_DESCRIPTION:\n${cv.meta.jobDescription.slice(0, 5000) || "(none)"}\n${quantifiedExtra}\n\nProduce the JSON patch to fix ATS_CHECK.`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.25,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) return null;

    const patch = parseJson(text);
    if (!patch) return null;
    if (/replace with|placeholder|\[|\]/i.test(JSON.stringify(patch))) return null;

    const patched = applyPatch(cv, patch);
    const report = scoreCV(patched);
    if (check.id === "content.quantified") {
      return applySmartQuantification(patched, {
        priorityBullets: check.items ?? [],
        targetRatio: 0.5,
      });
    }
    if (checkImproved(check, report) || check.category === "content") return patched;
    return patched;
  } catch {
    return null;
  }
}

export async function enhanceCvHolisticWithLlm(
  cv: CVData,
  failingChecks: AtsCheck[]
): Promise<CVData | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || !failingChecks.length) return null;

  const userPrompt = `FAILING_ATS_CHECKS:\n${JSON.stringify(failingChecks.map((c) => ({ id: c.id, label: c.label, message: c.message, fix: c.fix, items: c.items?.slice(0, 4) })), null, 2)}\n\nCV_FACTS:\n${JSON.stringify(cvFacts(cv), null, 2)}\n\nJOB_DESCRIPTION:\n${cv.meta.jobDescription.slice(0, 5000) || "(none)"}\n\nReturn a JSON patch that fixes ALL failing checks. Include summary, skills, and all experience entries that need bullet rewrites.`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.25,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) return null;
    const patch = parseJson(text);
    if (!patch || /replace with|placeholder|\[your|\[add/i.test(JSON.stringify(patch))) return null;
    return applyPatch(cv, patch);
  } catch {
    return null;
  }
}
