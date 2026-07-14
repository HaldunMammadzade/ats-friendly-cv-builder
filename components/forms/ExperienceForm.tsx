"use client";

import { CVData, Experience } from "@/types/cv";
import { uid } from "@/lib/uid";
import { Plus, Trash2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { SortableList } from "@/components/ui/SortableList";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

export default function ExperienceForm({ cv, onChange }: Props) {
  const update = (id: string, patch: Partial<Experience>) => {
    onChange({
      experience: cv.experience.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    });
  };

  const add = () => {
    onChange({
      experience: [
        ...cv.experience,
        {
          id: uid(),
          role: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          bullets: [""],
          tech: "",
        },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ experience: cv.experience.filter((e) => e.id !== id) });
  };

  const updateBullet = (expId: string, idx: number, value: string) => {
    const exp = cv.experience.find((e) => e.id === expId);
    if (!exp) return;
    const bullets = [...exp.bullets];
    bullets[idx] = value;
    update(expId, { bullets });
  };

  const addBullet = (expId: string) => {
    const exp = cv.experience.find((e) => e.id === expId);
    if (!exp) return;
    update(expId, { bullets: [...exp.bullets, ""] });
  };

  const removeBullet = (expId: string, idx: number) => {
    const exp = cv.experience.find((e) => e.id === expId);
    if (!exp) return;
    update(expId, { bullets: exp.bullets.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <SortableList
        items={cv.experience}
        onReorder={(experience) => onChange({ experience })}
        renderItem={(exp, idx) => (
          <div className="border border-ink-200 rounded-lg p-3 bg-ink-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                Experience #{idx + 1}
              </span>
              <button
                onClick={() => remove(exp.id)}
                className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded transition"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                className="form-input"
                value={exp.role}
                onChange={(e) => update(exp.id, { role: e.target.value })}
                placeholder="Role (Senior Frontend Developer)"
              />
              <input
                className="form-input"
                value={exp.company}
                onChange={(e) => update(exp.id, { company: e.target.value })}
                placeholder="Company"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                className="form-input"
                value={exp.location}
                onChange={(e) => update(exp.id, { location: e.target.value })}
                placeholder="Location"
              />
              <input
                className="form-input"
                value={exp.startDate}
                onChange={(e) => update(exp.id, { startDate: e.target.value })}
                placeholder="Start (01.2023)"
              />
              <input
                className="form-input"
                value={exp.current ? "Present" : exp.endDate}
                onChange={(e) => update(exp.id, { endDate: e.target.value })}
                disabled={exp.current}
                placeholder="End (12.2024)"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-ink-600 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) =>
                  update(exp.id, {
                    current: e.target.checked,
                    endDate: e.target.checked ? "" : exp.endDate,
                  })
                }
                className="rounded border-ink-300"
              />
              I currently work here
            </label>

            <div className="space-y-1.5 mb-2">
              <label className="form-label">
                Achievements / Responsibilities
              </label>
              {exp.bullets.map((b, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-ink-400 mt-2 text-sm">•</span>
                  <textarea
                    className="form-textarea flex-1"
                    rows={2}
                    value={b}
                    onChange={(e) => updateBullet(exp.id, i, e.target.value)}
                    placeholder="Delivered X using Y, resulting in Z impact."
                  />
                <button
                    onClick={() => removeBullet(exp.id, i)}
                    className="p-2 text-ink-400 hover:text-red-500 rounded mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addBullet(exp.id)}
                className="text-xs text-ink-600 hover:text-ink-900 inline-flex items-center gap-1 mt-1"
              >
                <Plus size={12} /> Add bullet
              </button>
            </div>

            <div>
              <label className="form-label">Tech Stack</label>
              <input
                className="form-input"
                value={exp.tech}
                onChange={(e) => update(exp.id, { tech: e.target.value })}
                placeholder="React | TypeScript | Next.js | Tailwind"
              />
            </div>
          </div>
        )}
      />

      <IconButton
        onClick={add}
        variant="outline"
        className="w-full justify-center"
      >
        <Plus size={16} /> Add experience
      </IconButton>
    </div>
  );
}
