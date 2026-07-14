"use client";

import { CVData, Personal } from "@/types/cv";

interface Props {
  cv: CVData;
  onChange: (patch: Partial<CVData>) => void;
}

const fields: { key: keyof Personal; label: string; placeholder: string }[] = [
  { key: "fullName", label: "Full Name", placeholder: "John Doe" },
  { key: "title", label: "Job Title", placeholder: "Senior Frontend Developer" },
  { key: "email", label: "Email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone", placeholder: "+994-XX-XXX-XX-XX" },
  { key: "location", label: "Location", placeholder: "Baku, Azerbaijan" },
  { key: "website", label: "Website", placeholder: "yourwebsite.com" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you" },
  { key: "github", label: "GitHub", placeholder: "github.com/you" },
];

export default function PersonalForm({ cv, onChange }: Props) {
  const update = (key: keyof Personal, value: string) => {
    onChange({ personal: { ...cv.personal, [key]: value } });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="form-label">{f.label}</label>
          <input
            className="form-input"
            value={cv.personal[f.key]}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        </div>
      ))}
    </div>
  );
}
