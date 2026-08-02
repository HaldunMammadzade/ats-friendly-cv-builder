import type { NextRequest } from "next/server";
import { ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { coverLetterSchema } from "@/lib/cv/schema";

export const GET = withAuth(async (user) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ok({ coverLetters: data ?? [] });
});

export const POST = withAuth(async (user, request: NextRequest) => {
  const body = coverLetterSchema.parse(await request.json());
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cover_letters")
    .insert({
      user_id: user.id,
      resume_id: body.resumeId ?? null,
      title: body.title,
      company: body.company,
      role: body.role,
      tone: body.tone,
      body: body.body,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return ok({ coverLetter: data }, 201);
});
