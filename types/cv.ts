export interface Personal {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  tech: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  details: string;
}

export interface Project {
  id: string;
  name: string;
  link: string;
  description: string;
  tech: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface CVData {
  id: string;
  name: string;
  personal: Personal;
  summary: string;
  skills: SkillGroup[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  languages: Language[];
  updatedAt: number;
}

export type SectionKey =
  | "personal"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "languages";
