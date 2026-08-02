import type { NextRequest } from "next/server";
import { ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { insertResume, listResumes } from "@/lib/api/resumes";
import { createCVRequestSchema } from "@/lib/cv/schema";
import { emptyCV, sampleCV } from "@/lib/cv/defaults";
import { parseCV } from "@/lib/cv/migrate";

export const GET = withAuth(async (user, request: NextRequest) => {
  const supabase = await createClient();
  const includeArchived =
    request.nextUrl.searchParams.get("archived") === "true";

  const resumes = await listResumes(supabase, user.id, includeArchived);
  return ok({ resumes });
});

export const POST = withAuth(async (user, request: NextRequest) => {
  const body = createCVRequestSchema.parse(await request.json().catch(() => ({})));
  const supabase = await createClient();

  const cv = body.data
    ? parseCV(body.data, body.title ?? "Untitled CV")
    : body.preset === "sample"
      ? sampleCV()
      : emptyCV(body.title ?? "Untitled CV");

  if (body.title) cv.name = body.title;

  const resume = await insertResume(supabase, user.id, cv, cv.name);
  return ok({ resume }, 201);
});
