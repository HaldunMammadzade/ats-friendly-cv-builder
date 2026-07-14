"use client";

import { CVData, Language } from "@/types/cv";
import { uid } from "@/lib/uid";
import { Plus, Trash2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { SortableList } from "@/components/ui/SortableList";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

const LEVELS = [
  "Native",
  "Bilingual",
  "Fluent",
  "Professional Working Proficiency",
  "Conversational",
  "Intermediate",
  "Basic",
];

export default function LanguagesForm({ cv, onChange }: Props) {
  const update = (id: string, patch: Partial<Language>) => {
    onChange({
      languages: cv.languages.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    });
  };

  const add = () => {
    onChange({
      languages: [...cv.languages, { id: uid(), name: "", level: "" }],
    });
  };

  const remove = (id: string) => {
    onChange({ languages: cv.languages.filter((l) => l.id !== id) });
  };

  return (
    <div className="space-y-3">
      <SortableList
        items={cv.languages}
        onReorder={(languages) => onChange({ languages })}
        renderItem={(lang) => (
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              <input
                className="form-input"
                value={lang.name}
                onChange={(e) => update(lang.id, { name: e.target.value })}
                placeholder="Language (English)"
              />
            </div>
            <div className="col-span-6">
              <select
                className="form-input"
                value={lang.level}
                onChange={(e) => update(lang.id, { level: e.target.value })}
              >
                <option value="">Select level…</option>
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
          </div>
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => remove(lang.id)}
                className="p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
        <Plus size={16} /> Add language
      </IconButton>
    </div>
  );
}
