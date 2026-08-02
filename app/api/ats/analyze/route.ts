import type { NextRequest } from "next/server";
import { z } from "zod";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume } from "@/lib/api/resumes";
import { parseCV } from "@/lib/cv/migrate";
import { scoreCV } from "@/lib/ats/score";

const bodySchema = z
  .object({
    resumeId: z.uuid().optional(),
    data: z.unknown().optional(),
  })
  .refine((v) => v.resumeId || v.data, {
    message: "Provide either resumeId or data.",
  });

/**
 * The same scorer runs in the browser for live feedback. This endpoint exists
 * so a stored CV can be scored without shipping its contents to the client,
 * and so scores stay consistent when the engine is updated.
 */
export const POST = withAuth(async (user, request: NextRequest) => {
  const body = bodySchema.parse(await request.json());

  if (body.resumeId) {
    const supabase = await createClient();
    const resume = await getResume(supabase, user.id, body.resumeId);
    if (!resume) return notFound("CV");
    return ok({ ats: scoreCV(resume.data) });
  }

  return ok({ ats: scoreCV(parseCV(body.data)) });
});
