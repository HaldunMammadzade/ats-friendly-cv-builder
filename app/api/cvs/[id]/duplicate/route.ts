import type { NextRequest } from "next/server";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume, insertResume } from "@/lib/api/resumes";
import { uid } from "@/lib/uid";

type Ctx = RouteContext<"/api/cvs/[id]/duplicate">;

export const POST = withAuth(async (user, request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const source = await getResume(supabase, user.id, id);
  if (!source) return notFound("CV");

  const body = (await request.json().catch(() => ({}))) as { title?: string };
  const title = body.title?.trim() || `${source.title} (copy)`;

  const copy = {
    ...structuredClone(source.data),
    id: uid(),
    name: title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const resume = await insertResume(supabase, user.id, copy, title);
  return ok({ resume }, 201);
});
