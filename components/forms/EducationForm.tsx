"use client";

import { CVData, Education } from "@/types/cv";
import { uid } from "@/lib/uid";
import { Plus, Trash2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { SortableList } from "@/components/ui/SortableList";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

export default function EducationForm({ cv, onChange }: Props) {
  const update = (id: string, patch: Partial<Education>) => {
    onChange({
      education: cv.education.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    });
  };

  const add = () => {
    onChange({
      education: [
        ...cv.education,
        {
          id: uid(),
          degree: "",
          school: "",
          location: "",
          startDate: "",
          endDate: "",
          details: "",
        },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ education: cv.education.filter((e) => e.id !== id) });
  };

  return (
    <div className="space-y-4">
      <SortableList
        items={cv.education}
        onReorder={(education) => onChange({ education })}
        renderItem={(edu, idx) => (
          <div className="border border-ink-200 rounded-lg p-3 bg-ink-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                Education #{idx + 1}
              </span>
              <button
                onClick={() => remove(edu.id)}
                className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded transition"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                className="form-input"
                value={edu.degree}
                onChange={(e) => update(edu.id, { degree: e.target.value })}
                placeholder="Degree (BSc Computer Science)"
              />
              <input
                className="form-input"
                value={edu.school}
                onChange={(e) => update(edu.id, { school: e.target.value })}
                placeholder="School / University"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                className="form-input"
                value={edu.location}
                onChange={(e) => update(edu.id, { location: e.target.value })}
                placeholder="Location"
              />
              <input
                className="form-input"
                value={edu.startDate}
                onChange={(e) => update(edu.id, { startDate: e.target.value })}
                placeholder="Start (09.2014)"
              />
              <input
                className="form-input"
                value={edu.endDate}
                onChange={(e) => update(edu.id, { endDate: e.target.value })}
                placeholder="End (06.2018)"
              />
            </div>

            <textarea
              className="form-textarea"
              rows={2}
              value={edu.details}
              onChange={(e) => update(edu.id, { details: e.target.value })}
              placeholder="Honors, relevant coursework (optional)"
            />
          </div>
        )}
      />

      <IconButton
        onClick={add}
        variant="outline"
        className="w-full justify-center"
      >
        <Plus size={16} /> Add education
      </IconButton>
    </div>
  );
}
