import type { NextRequest } from "next/server";
import { fail, notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import {
  deleteResume,
  getResume,
  snapshotResume,
  updateResume,
} from "@/lib/api/resumes";
import { updateCVRequestSchema } from "@/lib/cv/schema";
import { parseCV } from "@/lib/cv/migrate";
import { scoreCV } from "@/lib/ats/score";

type Ctx = RouteContext<"/api/cvs/[id]">;

export const GET = withAuth(async (user, _request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const resume = await getResume(supabase, user.id, id);
  if (!resume) return notFound("CV");

  return ok({ resume, ats: scoreCV(resume.data) });
});

export const PATCH = withAuth(async (user, request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = updateCVRequestSchema.parse(await request.json());
  const supabase = await createClient();

  const existing = await getResume(supabase, user.id, id);
  if (!existing) return notFound("CV");

  if (body.snapshot) {
    await snapshotResume(
      supabase,
      user.id,
      id,
      existing.data,
      body.snapshotLabel ?? "Before edit"
    );
  }

  const nextData = body.data
    ? parseCV(body.data, body.title ?? existing.title)
    : undefined;

  const resume = await updateResume(supabase, user.id, id, {
    title: body.title,
    data: nextData,
    isArchived: body.isArchived,
  });

  if (!resume) return notFound("CV");
  return ok({ resume, ats: scoreCV(resume.data) });
});

export const DELETE = withAuth(async (user, _request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const deleted = await deleteResume(supabase, user.id, id);
  if (!deleted) return notFound("CV");

  return ok({ deleted: true });
});

export const PUT = async () =>
  fail("Use PATCH to update a CV.", 405, "method_not_allowed");
