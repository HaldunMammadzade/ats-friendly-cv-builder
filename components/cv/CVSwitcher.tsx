"use client";

import { useCVStore } from "@/store/cvStore";
import { Plus, Copy, Trash2, FileText } from "lucide-react";
import { useState } from "react";

export default function CVSwitcher() {
  const { cvs, activeId, setActive, addCV, duplicateCV, removeCV, renameCV } =
    useCVStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
          <FileText size={15} /> My CVs ({cvs.length})
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-xs text-ink-700 hover:text-ink-900 inline-flex items-center gap-1 px-2 py-1 hover:bg-ink-100 rounded"
          >
            <Plus size={13} /> New
          </button>
          {showAdd && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg z-10 w-44 py-1">
              <button
                onClick={() => {
                  addCV("empty");
                  setShowAdd(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50"
              >
                Empty CV
              </button>
              <button
                onClick={() => {
                  addCV("frontend");
                  setShowAdd(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50"
              >
                Frontend Template
              </button>
              <button
                onClick={() => {
                  addCV("fullstack");
                  setShowAdd(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50"
              >
                Fullstack Template
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {cvs.map((cv) => {
          const isActive = cv.id === activeId;
          return (
            <div
              key={cv.id}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                isActive
                  ? "bg-ink-900 text-white"
                  : "bg-ink-50 hover:bg-ink-100 text-ink-800"
              }`}
              onClick={() => setActive(cv.id)}
            >
              <FileText size={14} className="flex-shrink-0" />
              {editingId === cv.id ? (
                <input
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                  value={cv.name}
                  onChange={(e) => renameCV(cv.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 text-sm font-medium truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(cv.id);
                  }}
                >
                  {cv.name}
                </span>
              )}

              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateCV(cv.id);
                  }}
                  className={`p-1 rounded ${
                    isActive ? "hover:bg-white/20" : "hover:bg-white"
                  }`}
                  title="Duplicate"
                >
                  <Copy size={12} />
                </button>
                {cvs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${cv.name}"?`)) removeCV(cv.id);
                    }}
                    className={`p-1 rounded ${
                      isActive ? "hover:bg-white/20" : "hover:bg-red-100 text-red-500"
                    }`}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-ink-400 mt-3 px-1">
        Double-click a name to rename it.
      </p>
    </div>
  );
}
