import type { NextRequest } from "next/server";
import { z } from "zod";
import { notFound, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

type Ctx = RouteContext<"/api/cover-letters/[id]">;

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  company: z.string().trim().max(160).optional(),
  role: z.string().trim().max(160).optional(),
  tone: z
    .enum(["professional", "friendly", "direct", "enthusiastic"])
    .optional(),
  body: z.string().max(20000).optional(),
  resumeId: z.uuid().nullish(),
});

export const GET = withAuth(async (user, _request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return notFound("Cover letter");

  return ok({ coverLetter: data });
});

export const PATCH = withAuth(async (user, request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = patchSchema.parse(await request.json());
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cover_letters")
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.company !== undefined && { company: body.company }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.tone !== undefined && { tone: body.tone }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.resumeId !== undefined && { resume_id: body.resumeId }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return notFound("Cover letter");

  return ok({ coverLetter: data });
});

export const DELETE = withAuth(async (user, _request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("cover_letters")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  if (!count) return notFound("Cover letter");

  return ok({ deleted: true });
});
