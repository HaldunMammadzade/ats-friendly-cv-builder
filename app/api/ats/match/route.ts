import type { NextRequest } from "next/server";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume } from "@/lib/api/resumes";
import { jobMatchSchema } from "@/lib/cv/schema";
import { parseCV } from "@/lib/cv/migrate";
import { matchJobDescription } from "@/lib/ats/match";

export const POST = withAuth(async (user, request: NextRequest) => {
  const body = jobMatchSchema.parse(await request.json());
  const supabase = await createClient();

  let cv;
  if (body.resumeId) {
    const resume = await getResume(supabase, user.id, body.resumeId);
    if (!resume) return notFound("CV");
    cv = resume.data;
  } else if (body.data) {
    cv = parseCV(body.data);
  } else {
    return notFound("CV");
  }

  const match = matchJobDescription(cv, body.jobDescription);

  if (body.persist) {
    const { error } = await supabase.from("job_targets").insert({
      user_id: user.id,
      resume_id: body.resumeId ?? null,
      company: body.company ?? cv.meta.targetCompany,
      role: body.role ?? cv.meta.targetRole,
      job_description: body.jobDescription,
      match_score: match.score,
      matched_keywords: match.matched.map((k) => k.surface),
      missing_keywords: match.missing.map((k) => k.surface),
    });
    if (error) throw new Error(error.message);
  }

  return ok({ match });
});
