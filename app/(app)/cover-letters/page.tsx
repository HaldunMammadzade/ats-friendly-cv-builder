import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/lib/api/resumes";
import type { CoverLetterRow } from "@/types/database";
import CoverLettersClient from "@/components/cover/CoverLettersClient";

export const metadata: Metadata = { title: "Cover letters" };

export default async function CoverLettersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: letters }, resumes] = await Promise.all([
    supabase
      .from("cover_letters")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    listResumes(supabase, user.id),
  ]);

  return (
    <CoverLettersClient
      initialLetters={(letters ?? []) as CoverLetterRow[]}
      resumes={resumes}
    />
  );
}
