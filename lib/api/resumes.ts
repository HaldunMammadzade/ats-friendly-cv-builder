import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CVData } from "@/types/cv";
import type { Database, Json, ResumeRow, ResumeUpdate } from "@/types/database";
import { migrateCV } from "@/lib/cv/migrate";
import { scoreCV } from "@/lib/ats/score";

export type Client = SupabaseClient<Database>;

export interface ResumeSummary {
  id: string;
  title: string;
  targetRole: string;
  atsScore: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeDetail extends ResumeSummary {
  data: CVData;
}

/**
 * Rehydrates a stored row into a valid CVData, repairing older or partial
 * documents on the way out so callers never see a half-shaped object.
 */
export function toDetail(row: ResumeRow): ResumeDetail {
  const data = migrateCV(row.data);
  // The row id is the source of truth; the embedded id can drift after a
  // duplicate or a restore.
  data.id = row.id;
  data.name = row.title;

  return {
    id: row.id,
    title: row.title,
    targetRole: row.target_role,
    atsScore: row.ats_score,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data,
  };
}

export function toSummary(row: Omit<ResumeRow, "data">): ResumeSummary {
  return {
    id: row.id,
    title: row.title,
    targetRole: row.target_role,
    atsScore: row.ats_score,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listResumes(
  supabase: Client,
  userId: string,
  includeArchived = false
): Promise<ResumeSummary[]> {
  let query = supabase
    .from("resumes")
    .select("id, user_id, title, ats_score, target_role, is_archived, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (!includeArchived) query = query.eq("is_archived", false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => toSummary(row as Omit<ResumeRow, "data">));
}

export async function getResume(
  supabase: Client,
  userId: string,
  id: string
): Promise<ResumeDetail | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toDetail(data) : null;
}

export async function insertResume(
  supabase: Client,
  userId: string,
  cv: CVData,
  title?: string
): Promise<ResumeDetail> {
  const report = scoreCV(cv);
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: title ?? cv.name,
      data: cv as unknown as Json,
      ats_score: report.score,
      target_role: cv.meta.targetRole || cv.personal.title || "",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toDetail(data);
}

export interface UpdateResumeInput {
  title?: string;
  data?: CVData;
  isArchived?: boolean;
}

export async function updateResume(
  supabase: Client,
  userId: string,
  id: string,
  input: UpdateResumeInput
): Promise<ResumeDetail | null> {
  const patch: ResumeUpdate = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.isArchived !== undefined) patch.is_archived = input.isArchived;

  if (input.data) {
    const cv = { ...input.data, name: input.title ?? input.data.name };
    patch.data = cv as unknown as Json;
    patch.ats_score = scoreCV(cv).score;
    patch.target_role = cv.meta.targetRole || cv.personal.title || "";
  }

  if (Object.keys(patch).length === 0) {
    return getResume(supabase, userId, id);
  }

  const { data, error } = await supabase
    .from("resumes")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toDetail(data) : null;
}

export async function snapshotResume(
  supabase: Client,
  userId: string,
  resumeId: string,
  cv: CVData,
  label = ""
): Promise<void> {
  const { error } = await supabase.from("resume_versions").insert({
    resume_id: resumeId,
    user_id: userId,
    data: cv as unknown as Json,
    ats_score: scoreCV(cv).score,
    label,
  });

  if (error) throw new Error(error.message);
}

export async function deleteResume(
  supabase: Client,
  userId: string,
  id: string
): Promise<boolean> {
  const { error, count } = await supabase
    .from("resumes")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
