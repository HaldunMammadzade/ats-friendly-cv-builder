"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CVData } from "@/types/cv";
import { emptyCV, sampleFrontendCV, sampleFullstackCV } from "@/lib/defaults";

interface CVStore {
  cvs: CVData[];
  activeId: string | null;
  hydrated: boolean;
  setHydrated: () => void;
  setActive: (id: string) => void;
  addCV: (preset?: "empty" | "frontend" | "fullstack") => void;
  duplicateCV: (id: string) => void;
  removeCV: (id: string) => void;
  renameCV: (id: string, name: string) => void;
  updateCV: (id: string, patch: Partial<CVData>) => void;
}

const initial = (): CVData[] => [sampleFrontendCV(), sampleFullstackCV()];

export const useCVStore = create<CVStore>()(
  persist(
    (set, get) => ({
      cvs: initial(),
      activeId: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setActive: (id) => set({ activeId: id }),
      addCV: (preset = "empty") => {
        const cv =
          preset === "frontend"
            ? sampleFrontendCV()
            : preset === "fullstack"
            ? sampleFullstackCV()
            : emptyCV();
        set((s) => ({ cvs: [...s.cvs, cv], activeId: cv.id }));
      },
      duplicateCV: (id) => {
        const cv = get().cvs.find((c) => c.id === id);
        if (!cv) return;
        const copy: CVData = {
          ...JSON.parse(JSON.stringify(cv)),
          id: `${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          name: `${cv.name} (Copy)`,
          updatedAt: Date.now(),
        };
        set((s) => ({ cvs: [...s.cvs, copy], activeId: copy.id }));
      },
      removeCV: (id) => {
        set((s) => {
          const cvs = s.cvs.filter((c) => c.id !== id);
          const activeId =
            s.activeId === id ? cvs[0]?.id ?? null : s.activeId;
          return { cvs, activeId };
        });
      },
      renameCV: (id, name) => {
        set((s) => ({
          cvs: s.cvs.map((c) =>
            c.id === id ? { ...c, name, updatedAt: Date.now() } : c
          ),
        }));
      },
      updateCV: (id, patch) => {
        set((s) => ({
          cvs: s.cvs.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        }));
      },
    }),
    {
      name: "cv-builder-storage-v1",
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.activeId && state.cvs.length > 0) {
            state.activeId = state.cvs[0].id;
          }
          state.hydrated = true;
        }
      },
    }
  )
);
