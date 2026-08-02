import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getResume } from "@/lib/api/resumes";
import EditorShell from "@/components/editor/EditorShell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const resume = await getResume(supabase, user.id, id);

  return { title: resume ? resume.title : "CV" };
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const resume = await getResume(supabase, user.id, id);
  if (!resume) notFound();

  return <EditorShell resume={resume} />;
}
