import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/lib/api/resumes";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = { title: "Your CVs" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const resumes = await listResumes(supabase, user.id, true);

  return <DashboardClient initialResumes={resumes} />;
}
