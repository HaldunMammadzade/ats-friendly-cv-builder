"use client";

import { CVData } from "@/types/cv";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

export default function SummaryForm({ cv, onChange }: Props) {
  return (
    <div>
      <label className="form-label">Professional Summary</label>
      <textarea
        className="form-textarea"
        rows={5}
        value={cv.summary}
        onChange={(e) => onChange({ summary: e.target.value })}
        placeholder="A short, impactful summary of your experience and what you bring to the table. 2-4 sentences is ideal."
      />
      <p className="text-xs text-ink-500 mt-1.5">
        Tip: ATS systems read this section first. Include 2-3 key technologies and your years of experience.
      </p>
    </div>
  );
}
