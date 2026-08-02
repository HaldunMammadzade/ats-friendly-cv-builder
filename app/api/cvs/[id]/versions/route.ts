import type { NextRequest } from "next/server";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume, snapshotResume } from "@/lib/api/resumes";

type Ctx = RouteContext<"/api/cvs/[id]/versions">;

export const GET = withAuth(async (user, _request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  // Version rows are large; the list view only needs the metadata.
  const { data, error } = await supabase
    .from("resume_versions")
    .select("id, version, label, ats_score, created_at")
    .eq("resume_id", id)
    .eq("user_id", user.id)
    .order("version", { ascending: false });

  if (error) throw new Error(error.message);

  return ok({
    versions: (data ?? []).map((v) => ({
      id: v.id,
      version: v.version,
      label: v.label,
      atsScore: v.ats_score,
      createdAt: v.created_at,
    })),
  });
});

export const POST = withAuth(async (user, request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const resume = await getResume(supabase, user.id, id);
  if (!resume) return notFound("CV");

  const body = (await request.json().catch(() => ({}))) as { label?: string };
  await snapshotResume(
    supabase,
    user.id,
    id,
    resume.data,
    body.label?.trim() || "Manual save point"
  );

  return ok({ created: true }, 201);
});
