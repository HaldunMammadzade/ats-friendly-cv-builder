import type { CoverLetterContext, EvidenceItem } from "./context";
import type { Tone } from "./generate";

function toProse(bullet: string): string {
  const cleaned = bullet.replace(/[.]\s*$/, "").trim();
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function greeting(ctx: CoverLetterContext): string {
  if (ctx.hiringManager) return `Dear ${ctx.hiringManager},`;
  return `Dear ${ctx.company} Hiring Team,`;
}

function displayKeyword(term: string): string {
  const key = term.toLowerCase();
  const known: Record<string, string> = {
    react: "React",
    typescript: "TypeScript",
    "next.js": "Next.js",
    javascript: "JavaScript",
    vue: "Vue.js",
    "vue.js": "Vue.js",
    node: "Node.js",
    "node.js": "Node.js",
  };
  return known[key] ?? (term.charAt(0).toUpperCase() + term.slice(1));
}

function listPhrase(items: string[]): string {
  const clean = items.filter(Boolean).map(displayKeyword);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

function composeOpening(ctx: CoverLetterContext): string {
  const { candidate, role, company, tone, match, domain } = ctx;
  const keywords = ctx.matchedKeywords.slice(0, 4);
  const seniority = candidate.title || role;

  const summaryLead = candidate.summary
    ? candidate.summary.split(/(?<=[.!?])\s+/).slice(0, 1)[0]
    : "";

  const templates: Record<Tone, () => string> = {
    professional: () => {
      const parts = [
        `I am writing to apply for the ${role} position at ${company}.`,
        candidate.duration
          ? `As a ${seniority} with ${candidate.duration} of experience${candidate.location ? `, based in ${candidate.location}` : ""}, I have delivered ${domain} in high-stakes environments.`
          : `As a ${seniority}${candidate.location ? ` based in ${candidate.location}` : ""}, I have delivered ${domain} in high-stakes environments.`,
      ];
      if (match && keywords.length) {
        parts.push(
          `Your posting emphasises ${listPhrase(keywords)}, which maps directly to the work I have shipped in my recent roles.`
        );
      } else if (summaryLead) {
        parts.push(summaryLead);
      }
      return parts.join(" ");
    },
    friendly: () => {
      const parts = [
        `I was excited to see the ${role} opening at ${company} — it matches the kind of impact I want to create next.`,
        candidate.duration
          ? `I am a ${seniority} with ${candidate.duration} behind me, and I have spent that time on ${domain}.`
          : `I am a ${seniority}, and I have spent my career on ${domain}.`,
      ];
      if (keywords.length) {
        parts.push(
          `The posting's focus on ${listPhrase(keywords.slice(0, 3))} is especially familiar territory for me.`
        );
      }
      return parts.join(" ");
    },
    direct: () => {
      const parts = [
        `I am a strong fit for the ${role} role at ${company}.`,
        candidate.duration
          ? `${candidate.duration} of ${seniority} work on ${domain} is the short version.`
          : `My ${seniority} background on ${domain} is the short version.`,
      ];
      if (match) {
        parts.push(
          `Your requirements align at ${match.score}% on the skills and scope I already own in production.`
        );
      }
      return parts.join(" ");
    },
    enthusiastic: () => {
      const parts = [
        `The ${role} opportunity at ${company} is exactly the challenge I have been building toward.`,
        candidate.duration
          ? `Over ${candidate.duration} as a ${seniority}, I have shipped ${domain} that moved real metrics — not slide-deck prototypes.`
          : `As a ${seniority}, I have shipped ${domain} that moved real metrics — not slide-deck prototypes.`,
      ];
      if (ctx.roleMission) {
        parts.push(`Reading that ${ctx.roleMission.charAt(0).toLowerCase()}${ctx.roleMission.slice(1)} resonated immediately.`);
      } else if (keywords.length) {
        parts.push(
          `Seeing ${listPhrase(keywords.slice(0, 3))} in the posting confirmed this is the right match.`
        );
      }
      return parts.join(" ");
    },
  };

  return templates[tone]();
}

function weaveEvidence(ctx: CoverLetterContext): string {
  const items = ctx.evidence;
  if (!items.length) {
    return "In my recent roles I have owned delivery end to end — from architecture through production release — and I would welcome the chance to outline specific outcomes in conversation.";
  }

  const sentences = items.map((item, index) =>
    formatEvidenceSentence(item, index, ctx.tone)
  );

  if (ctx.match && ctx.match.score >= 55 && ctx.matchedKeywords.length >= 3) {
    sentences.push(
      `Across these roles, the through-line is ${listPhrase(ctx.matchedKeywords.slice(0, 3))} — the same stack and scope your team describes.`
    );
  }

  return sentences.join(" ");
}

function formatEvidenceSentence(
  item: EvidenceItem,
  index: number,
  tone: Tone
): string {
  const prose = toProse(item.text);
  const at = item.company ? `At ${item.company}` : "Recently";

  if (index === 0) {
    return `${at}, I ${prose}.`;
  }

  const bridges: Record<Tone, string[]> = {
    professional: ["Previously", "Before that", "Earlier in my career"],
    friendly: ["I also", "Another highlight:", "On an earlier team,"],
    direct: ["Also:", "Additionally,", "Prior role:"],
    enthusiastic: ["I also got to", "Another win:", "I loved that I could"],
  };

  const bridge = bridges[tone][Math.min(index - 1, bridges[tone].length - 1)];
  if (tone === "enthusiastic" && index === 1) {
    return `${bridge} ${prose} while serving as ${item.role} at ${item.company}.`;
  }
  return `${bridge} at ${item.company}, I ${prose}.`;
}

function composeFit(ctx: CoverLetterContext): string {
  const { company, role, responsibilities, companyPitch, roleMission, criticalGaps, matchedKeywords } = ctx;

  if (companyPitch && matchedKeywords.length) {
    return `${companyPitch.replace(/\.$/, "")}. That mission aligns with how I work: I have repeatedly applied ${listPhrase(matchedKeywords.slice(0, 4))} to ship ${role.toLowerCase().includes("lead") || role.toLowerCase().includes("senior") ? "platforms at scale" : "reliable product surfaces"} — and I would bring the same approach to ${company}.`;
  }

  if (roleMission && responsibilities.length) {
    return `Your description of the role — ${roleMission.charAt(0).toLowerCase()}${roleMission.slice(1).replace(/\.$/, "")} — mirrors work I have already done. In practice that has meant ${listPhrase(responsibilities.slice(0, 2).map((r) => r.charAt(0).toLowerCase() + r.slice(1).replace(/\.$/, "")))}, using ${listPhrase(matchedKeywords.slice(0, 3))} day to day.`;
  }

  if (responsibilities.length >= 2) {
    return `The responsibilities you outline — ${listPhrase(responsibilities.slice(0, 2).map((r) => r.charAt(0).toLowerCase() + r.slice(1).replace(/\.$/, "")))} — are the same problems I have solved recently. I am particularly ready to contribute on ${listPhrase(matchedKeywords.slice(0, 4))}.`;
  }

  if (matchedKeywords.length >= 3) {
    return `What stands out in your posting is the emphasis on ${listPhrase(matchedKeywords.slice(0, 5))}. I have used that combination in production, not just in side projects, and I am confident I can add value to the ${role} team quickly.`;
  }

  let fit = `I am motivated by ${company}'s direction in this space and by the scope of the ${role} position.`;
  if (criticalGaps.length) {
    fit += ` I would also welcome a conversation about ${listPhrase(criticalGaps)} — while not listed on my CV verbatim, I have tackled adjacent problems in recent roles.`;
  }
  return fit;
}

const CLOSINGS: Record<Tone, (company: string, role: string) => string> = {
  professional: (company, role) =>
    `I would welcome the opportunity to discuss how my experience translates to ${role} at ${company}. Thank you for your consideration.`,
  friendly: (company) =>
    `I would love to talk about how I could help the team at ${company}. Thanks for reading — I hope we connect soon.`,
  direct: (company) =>
    `I am available for a conversation this week. If the fit looks right, I would like to discuss next steps for joining ${company}.`,
  enthusiastic: (company, role) =>
    `I would be glad to walk through any of this in more detail. I am genuinely excited about contributing to ${company} as ${role}.`,
};

export function composeCoverLetter(ctx: CoverLetterContext): string {
  const signOff = `Sincerely,\n${ctx.candidate.name || "[Your name]"}`;
  const contact = [ctx.candidate.email, ctx.candidate.phone]
    .filter(Boolean)
    .join(" · ");

  return [
    greeting(ctx),
    "",
    composeOpening(ctx),
    "",
    weaveEvidence(ctx),
    "",
    composeFit(ctx),
    "",
    CLOSINGS[ctx.tone](ctx.company, ctx.role),
    "",
    signOff,
    contact,
  ]
    .join("\n")
    .trim();
}
