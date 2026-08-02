import type { NextRequest } from "next/server";
import { z } from "zod";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume } from "@/lib/api/resumes";
import { parseCV } from "@/lib/cv/migrate";
import { generateCoverLetter } from "@/lib/cover-letter/generate";

const bodySchema = z
  .object({
    resumeId: z.uuid().optional(),
    data: z.unknown().optional(),
    company: z.string().trim().max(160).optional(),
    role: z.string().trim().max(160).optional(),
    hiringManager: z.string().trim().max(120).optional(),
    jobDescription: z.string().trim().max(20000).optional(),
    tone: z
      .enum(["professional", "friendly", "direct", "enthusiastic"])
      .default("professional"),
    useAi: z.boolean().optional(),
  })
  .refine((v) => v.resumeId || v.data, {
    message: "Provide either resumeId or data.",
  });

export const POST = withAuth(async (user, request: NextRequest) => {
  const body = bodySchema.parse(await request.json());

  let cv;
  if (body.resumeId) {
    const supabase = await createClient();
    const resume = await getResume(supabase, user.id, body.resumeId);
    if (!resume) return notFound("CV");
    cv = resume.data;
  } else {
    cv = parseCV(body.data);
  }

  const draft = await generateCoverLetter({
    cv,
    company: body.company,
    role: body.role,
    hiringManager: body.hiringManager,
    jobDescription: body.jobDescription,
    tone: body.tone,
    useAi: body.useAi,
  });

  return ok({ draft });
});
