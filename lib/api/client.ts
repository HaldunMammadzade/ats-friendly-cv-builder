import type { CVData } from "@/types/cv";
import type { AtsReport } from "@/lib/ats/score";
import type { JobMatchResult } from "@/lib/ats/match";
import type { CoverLetterRow } from "@/types/database";
import type { ResumeDetail, ResumeSummary } from "@/lib/api/resumes";

/** Typed wrapper around the JSON API. Throws ApiError on any non-2xx. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let payload: { error?: string; code?: string; details?: unknown } = {};
    try {
      payload = await response.json();
    } catch {
      // Non-JSON error body (e.g. an upstream 502 HTML page).
    }
    throw new ApiError(
      payload.error ?? `Request failed with ${response.status}.`,
      response.status,
      payload.code ?? "error",
      payload.details
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  listResumes: (archived = false) =>
    request<{ resumes: ResumeSummary[] }>(
      `/api/cvs${archived ? "?archived=true" : ""}`
    ),

  createResume: (input: {
    title?: string;
    preset?: "empty" | "sample";
    data?: CVData;
  }) =>
    request<{ resume: ResumeDetail }>("/api/cvs", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getResume: (id: string) =>
    request<{ resume: ResumeDetail; ats: AtsReport }>(`/api/cvs/${id}`),

  updateResume: (
    id: string,
    input: {
      title?: string;
      data?: CVData;
      isArchived?: boolean;
      snapshot?: boolean;
      snapshotLabel?: string;
    }
  ) =>
    request<{ resume: ResumeDetail; ats: AtsReport }>(`/api/cvs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteResume: (id: string) =>
    request<{ deleted: boolean }>(`/api/cvs/${id}`, { method: "DELETE" }),

  duplicateResume: (id: string, title?: string) =>
    request<{ resume: ResumeDetail }>(`/api/cvs/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  listVersions: (id: string) =>
    request<{
      versions: {
        id: string;
        version: number;
        label: string;
        atsScore: number | null;
        createdAt: string;
      }[];
    }>(`/api/cvs/${id}/versions`),

  createVersion: (id: string, label?: string) =>
    request<{ created: boolean }>(`/api/cvs/${id}/versions`, {
      method: "POST",
      body: JSON.stringify({ label }),
    }),

  restoreVersion: (id: string, versionId: string) =>
    request<{ resume: ResumeDetail; ats: AtsReport; restoredFrom: number }>(
      `/api/cvs/${id}/versions/${versionId}/restore`,
      { method: "POST" }
    ),

  matchJob: (input: {
    jobDescription: string;
    resumeId?: string;
    data?: CVData;
    company?: string;
    role?: string;
    persist?: boolean;
  }) =>
    request<{ match: JobMatchResult }>("/api/ats/match", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  fixAtsCheck: (input: { data: CVData; check: import("@/lib/ats/score").AtsCheck }) =>
    request<{
      applied: boolean;
      message: string;
      mode: "ai" | "engine";
      cv: CVData;
      ats: AtsReport;
    }>("/api/ats/fix", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  fixAllAtsIssues: (input: { data: CVData }) =>
    request<{
      applied: boolean;
      message: string;
      mode: "ai" | "engine";
      cv: CVData;
      ats: AtsReport;
    }>("/api/ats/fix-all", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  generateCoverLetter: (input: {
    resumeId?: string;
    data?: CVData;
    company?: string;
    role?: string;
    hiringManager?: string;
    jobDescription?: string;
    tone?: "professional" | "friendly" | "direct" | "enthusiastic";
    useAi?: boolean;
  }) =>
    request<{
      draft: {
        body: string;
        wordCount: number;
        usedKeywords: string[];
        notes: string[];
        quality: {
          score: number;
          matchScore: number | null;
          evidenceCount: number;
          hasJobDescription: boolean;
        };
        mode: "deterministic" | "ai";
      };
    }>("/api/cover-letters/generate", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listCoverLetters: () =>
    request<{ coverLetters: CoverLetterRow[] }>("/api/cover-letters"),

  createCoverLetter: (input: {
    title: string;
    company?: string;
    role?: string;
    body?: string;
    tone?: "professional" | "friendly" | "direct" | "enthusiastic";
    resumeId?: string | null;
  }) =>
    request<{ coverLetter: CoverLetterRow }>("/api/cover-letters", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateCoverLetter: (
    id: string,
    input: Partial<{
      title: string;
      company: string;
      role: string;
      body: string;
      tone: "professional" | "friendly" | "direct" | "enthusiastic";
      resumeId: string | null;
    }>
  ) =>
    request<{ coverLetter: CoverLetterRow }>(`/api/cover-letters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteCoverLetter: (id: string) =>
    request<{ deleted: boolean }>(`/api/cover-letters/${id}`, {
      method: "DELETE",
    }),

  importResume: (file: File, save: boolean) => {
    const form = new FormData();
    form.append("file", file);
    form.append("save", String(save));
    return request<{
      cv?: CVData;
      resume?: ResumeDetail;
      confidence: number;
      warnings: string[];
      ats: AtsReport;
    }>("/api/import", { method: "POST", body: form });
  },

  async downloadDocx(input: { resumeId?: string; data?: CVData }) {
    const response = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new ApiError("Could not build the DOCX file.", response.status, "export_failed");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename =
      /filename="([^"]+)"/.exec(disposition)?.[1] ?? "resume.docx";

    return { blob, filename };
  },
};

/** Triggers a browser download for an in-memory blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
