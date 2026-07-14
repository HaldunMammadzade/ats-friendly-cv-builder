"use client";

import { CVData, SkillGroup } from "@/types/cv";
import { uid } from "@/lib/uid";
import { Plus, Trash2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { SortableList } from "@/components/ui/SortableList";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

export default function SkillsForm({ cv, onChange }: Props) {
  const update = (id: string, patch: Partial<SkillGroup>) => {
    onChange({
      skills: cv.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const add = () => {
    onChange({
      skills: [...cv.skills, { id: uid(), category: "", items: "" }],
    });
  };

  const remove = (id: string) => {
    onChange({ skills: cv.skills.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-3">
      <SortableList
        items={cv.skills}
        onReorder={(skills) => onChange({ skills })}
        renderItem={(s) => (
          <div className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-4">
              <input
                className="form-input"
                value={s.category}
                onChange={(e) => update(s.id, { category: e.target.value })}
                placeholder="Category"
              />
            </div>
            <div className="col-span-7">
              <input
                className="form-input"
                value={s.items}
                onChange={(e) => update(s.id, { items: e.target.value })}
                placeholder="React | TypeScript | Next.js"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => remove(s.id)}
                className="p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                aria-label="Remove skill"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      />

      <IconButton
        onClick={add}
        variant="outline"
        className="w-full justify-center"
      >
        <Plus size={16} /> Add skill category
      </IconButton>
    </div>
  );
}
