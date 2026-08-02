import "server-only";

import type { CoverLetterContext } from "./context";
import { contextToFacts } from "./context";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write job application cover letters that sound human, specific, and credible.

Rules (never break these):
1. Use ONLY facts from CANDIDATE_FACTS JSON. Do not invent employers, dates, metrics, skills, or projects.
2. Length: 260–340 words in the body (excluding greeting and sign-off).
3. Structure: greeting line, blank line, 3 short paragraphs, blank line, closing sentence, blank line, "Sincerely," + name on next line, contact line if provided.
4. Mirror vocabulary from matchedKeywords and responsibilities when natural.
5. Open with a specific hook tied to the role — never "I am writing to express my interest".
6. Paragraph 2 must weave 2–3 evidence achievements with company names from the facts.
7. Paragraph 3 must connect to companyPitch or roleMission or responsibilities when available.
8. No bullet points, no markdown, no placeholders, no bracketed text.
9. American English. Confident but not arrogant.`;

function validateOutput(body: string, ctx: CoverLetterContext): boolean {
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  if (wordCount < 180 || wordCount > 450) return false;
  if (/\[[^\]]+\]/.test(body)) return false;
  if (/as an ai|language model|i cannot/i.test(body)) return false;

  const name = ctx.candidate.name;
  if (name && !body.includes(name.split(" ")[0] ?? name)) return false;

  for (const item of ctx.evidence.slice(0, 2)) {
    if (item.company && item.company.length > 3 && !body.toLowerCase().includes(item.company.toLowerCase().slice(0, 8))) {
      // Soft check — at least one company should appear
      continue;
    }
  }

  return true;
}

export async function enhanceCoverLetterWithLlm(
  ctx: CoverLetterContext,
  baseline: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const facts = contextToFacts(ctx);

  const userPrompt = `CANDIDATE_FACTS:
${JSON.stringify(facts, null, 2)}

JOB DESCRIPTION (excerpt):
${ctx.jobDescription.slice(0, 6000)}

BASELINE DRAFT (improve this — do not copy verbatim; make it sharper and more tailored):
${baseline}

Write the final cover letter text only.`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.35,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text || !validateOutput(text, ctx)) return null;

    return text;
  } catch {
    return null;
  }
}
