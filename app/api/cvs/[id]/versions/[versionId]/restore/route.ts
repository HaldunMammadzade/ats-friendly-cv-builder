import type { NextRequest } from "next/server";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume, snapshotResume, updateResume } from "@/lib/api/resumes";
import { parseCV } from "@/lib/cv/migrate";
import { scoreCV } from "@/lib/ats/score";

type Ctx = RouteContext<"/api/cvs/[id]/versions/[versionId]/restore">;

export const POST = withAuth(async (user, _request: NextRequest, ctx: Ctx) => {
  const { id, versionId } = await ctx.params;
  const supabase = await createClient();

  const current = await getResume(supabase, user.id, id);
  if (!current) return notFound("CV");

  const { data: version, error } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("id", versionId)
    .eq("resume_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!version) return notFound("Version");

  // Snapshot what we're about to overwrite, so a restore is itself undoable.
  await snapshotResume(
    supabase,
    user.id,
    id,
    current.data,
    `Replaced by restore of v${version.version}`
  );

  const restored = parseCV(version.data, current.title);
  restored.id = id;
  restored.updatedAt = Date.now();

  const resume = await updateResume(supabase, user.id, id, { data: restored });
  if (!resume) return notFound("CV");

  return ok({ resume, ats: scoreCV(resume.data), restoredFrom: version.version });
});
