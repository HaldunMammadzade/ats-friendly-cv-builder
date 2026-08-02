"use client";

import { create } from "zustand";
import { produce, type Draft } from "immer";
import type { CVData } from "@/types/cv";
import { scoreCV, type AtsReport } from "@/lib/ats/score";
import { matchJobDescription, type JobMatchResult } from "@/lib/ats/match";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface EditorState {
  resumeId: string;
  cv: CVData;
  /** Recomputed synchronously on every edit; the scorer is cheap and pure. */
  ats: AtsReport;
  jobMatch: JobMatchResult | null;
  status: SaveStatus;
  errorMessage: string | null;
  lastSavedAt: number | null;
  /** Guards the once-per-session restore point taken before the first edit. */
  snapshotTaken: boolean;

  initialize: (resumeId: string, cv: CVData) => void;
  /** Applies an immer recipe and refreshes the derived ATS report. */
  mutate: (recipe: (draft: Draft<CVData>) => void) => void;
  replace: (cv: CVData) => void;
  setStatus: (status: SaveStatus, error?: string | null) => void;
  markSaved: (at?: number) => void;
  markSnapshotTaken: () => void;
  runJobMatch: (jobDescription: string) => JobMatchResult | null;
  clearJobMatch: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  resumeId: "",
  cv: {} as CVData,
  ats: {} as AtsReport,
  jobMatch: null,
  status: "idle",
  errorMessage: null,
  lastSavedAt: null,
  snapshotTaken: false,

  initialize: (resumeId, cv) =>
    set({
      resumeId,
      cv,
      ats: scoreCV(cv),
      jobMatch: cv.meta.jobDescription
        ? matchJobDescription(cv, cv.meta.jobDescription)
        : null,
      status: "idle",
      errorMessage: null,
      lastSavedAt: cv.updatedAt,
      snapshotTaken: false,
    }),

  mutate: (recipe) => {
    const next = produce(get().cv, (draft) => {
      recipe(draft);
      draft.updatedAt = Date.now();
    });

    set({ cv: next, ats: scoreCV(next), status: "dirty", errorMessage: null });
  },

  replace: (cv) =>
    set({
      cv,
      ats: scoreCV(cv),
      status: "dirty",
      errorMessage: null,
    }),

  setStatus: (status, error = null) => set({ status, errorMessage: error }),

  markSaved: (at = Date.now()) =>
    set({ status: "saved", lastSavedAt: at, errorMessage: null }),

  markSnapshotTaken: () => set({ snapshotTaken: true }),

  runJobMatch: (jobDescription) => {
    const trimmed = jobDescription.trim();
    if (trimmed.length < 40) {
      set({ jobMatch: null });
      return null;
    }
    const match = matchJobDescription(get().cv, trimmed);
    set({ jobMatch: match });
    return match;
  },

  clearJobMatch: () => set({ jobMatch: null }),
}));
