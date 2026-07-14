"use client";

import { useCVStore } from "@/store/cvStore";
import { CVData } from "@/types/cv";
import {
  User,
  FileText,
  Code,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Languages,
} from "lucide-react";

import Section from "@/components/ui/Section";
import PersonalForm from "@/components/forms/PersonalForm";
import SummaryForm from "@/components/forms/SummaryForm";
import SkillsForm from "@/components/forms/SkillsForm";
import ExperienceForm from "@/components/forms/ExperienceForm";
import EducationForm from "@/components/forms/EducationForm";
import ProjectsForm from "@/components/forms/ProjectsForm";
import LanguagesForm from "@/components/forms/LanguagesForm";

export default function Editor() {
  const { cvs, activeId, updateCV } = useCVStore();
  const cv = cvs.find((c) => c.id === activeId);

  if (!cv) {
    return (
      <div className="text-center text-ink-500 text-sm py-12">
        No CV selected. Create one from the sidebar.
      </div>
    );
  }

  const onChange = (patch: Partial<CVData>) => {
    updateCV(cv.id, patch);
  };

  return (
    <div className="space-y-3">
      <Section title="Personal Info" icon={<User size={15} />}>
        <PersonalForm cv={cv} onChange={onChange} />
      </Section>

      <Section title="Summary" icon={<FileText size={15} />}>
        <SummaryForm cv={cv} onChange={onChange} />
      </Section>

      <Section title="Skills" icon={<Code size={15} />}>
        <SkillsForm cv={cv} onChange={onChange} />
      </Section>

      <Section title="Work Experience" icon={<Briefcase size={15} />}>
        <ExperienceForm cv={cv} onChange={onChange} />
      </Section>

      <Section title="Projects" icon={<FolderGit2 size={15} />} defaultOpen={false}>
        <ProjectsForm cv={cv} onChange={onChange} />
      </Section>

      <Section title="Education" icon={<GraduationCap size={15} />} defaultOpen={false}>
        <EducationForm cv={cv} onChange={onChange} />
      </Section>

      <Section title="Languages" icon={<Languages size={15} />} defaultOpen={false}>
        <LanguagesForm cv={cv} onChange={onChange} />
      </Section>
    </div>
  );
}
