"use client";

import { useEffect } from "react";
import { api, ApiError } from "@/lib/api/client";
import { useEditorStore } from "@/store/editorStore";

const DEBOUNCE_MS = 1200;

let inFlight = false;
let pending = false;

/**
 * Reads everything it needs off the store rather than from props, so the save
 * path is a plain function with no React dependencies and can be called from
 * an unload handler as safely as from a debounce.
 */
async function flush(): Promise<void> {
  const state = useEditorStore.getState();
  if (!state.resumeId || !state.cv?.id) return;

  if (inFlight) {
    pending = true;
    return;
  }

  inFlight = true;
  state.setStatus("saving");

  try {
    const takeSnapshot = !state.snapshotTaken;
    await api.updateResume(state.resumeId, {
      title: state.cv.name,
      data: state.cv,
      snapshot: takeSnapshot,
      snapshotLabel: takeSnapshot ? "Auto save point" : undefined,
    });

    if (takeSnapshot) useEditorStore.getState().markSnapshotTaken();
    useEditorStore.getState().markSaved();
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Could not reach the server. Your changes are still in this tab.";
    useEditorStore.getState().setStatus("error", message);
  } finally {
    inFlight = false;
    if (pending) {
      pending = false;
      void flush();
    }
  }
}

/**
 * Persists editor changes on a debounce and on page hide.
 *
 * The first save of a session also writes a restore point, so there is always
 * a way back to the document as it was when the tab was opened.
 */
export function useAutosave() {
  const cv = useEditorStore((s) => s.cv);
  const status = useEditorStore((s) => s.status);

  useEffect(() => {
    if (status !== "dirty") return;

    const timer = setTimeout(() => void flush(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [cv, status]);

  // A tab can be discarded without ever firing `beforeunload`; `visibilitychange`
  // is the reliable last chance to persist.
  useEffect(() => {
    const onHide = () => {
      if (useEditorStore.getState().status === "dirty") void flush();
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (useEditorStore.getState().status === "dirty") event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { saveNow: flush };
}
