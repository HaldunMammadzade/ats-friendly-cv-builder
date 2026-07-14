"use client";

import { CVData, Project } from "@/types/cv";
import { uid } from "@/lib/uid";
import { Plus, Trash2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { SortableList } from "@/components/ui/SortableList";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

export default function ProjectsForm({ cv, onChange }: Props) {
  const update = (id: string, patch: Partial<Project>) => {
    onChange({
      projects: cv.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const add = () => {
    onChange({
      projects: [
        ...cv.projects,
        { id: uid(), name: "", link: "", description: "", tech: "" },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ projects: cv.projects.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-4">
      <SortableList
        items={cv.projects}
        onReorder={(projects) => onChange({ projects })}
        renderItem={(p, idx) => (
          <div className="border border-ink-200 rounded-lg p-3 bg-ink-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                Project #{idx + 1}
              </span>
              <button
                onClick={() => remove(p.id)}
                className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded transition"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                className="form-input"
                value={p.name}
                onChange={(e) => update(p.id, { name: e.target.value })}
                placeholder="Project name"
              />
              <input
                className="form-input"
                value={p.link}
                onChange={(e) => update(p.id, { link: e.target.value })}
                placeholder="Link (yourproject.com)"
              />
            </div>

            <textarea
              className="form-textarea mb-2"
              rows={2}
              value={p.description}
              onChange={(e) => update(p.id, { description: e.target.value })}
              placeholder="What it does and what you built (1-2 lines)."
            />

            <input
              className="form-input"
              value={p.tech}
              onChange={(e) => update(p.id, { tech: e.target.value })}
              placeholder="Tech: Next.js | TypeScript | Supabase"
            />
          </div>
        )}
      />

      <IconButton
        onClick={add}
        variant="outline"
        className="w-full justify-center"
      >
        <Plus size={16} /> Add project
      </IconButton>
    </div>
  );
}
