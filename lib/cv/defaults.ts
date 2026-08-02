import {
  CVData,
  CVDesign,
  CV_SCHEMA_VERSION,
  Certification,
  CustomSection,
  DEFAULT_SECTION_ORDER,
  Education,
  Experience,
  LanguageItem,
  Project,
  SECTION_LABELS,
  SectionConfig,
  SkillGroup,
} from "@/types/cv";
import { uid } from "@/lib/uid";

export const defaultDesign = (): CVDesign => ({
  template: "classic",
  fontFamily: "sans",
  fontSize: 10.5,
  lineHeight: 1.35,
  sectionSpacing: 10,
  accentColor: "#111827",
  paperSize: "a4",
  margin: 16,
});

export const defaultSections = (): SectionConfig[] =>
  DEFAULT_SECTION_ORDER.map((key) => ({
    key,
    visible: true,
    title: SECTION_LABELS[key],
  }));

export const emptyExperience = (): Experience => ({
  id: uid(),
  role: "",
  company: "",
  location: "",
  employmentType: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
  tech: [],
});

export const emptyEducation = (): Education => ({
  id: uid(),
  degree: "",
  field: "",
  school: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  gpa: "",
  details: "",
});

export const emptyProject = (): Project => ({
  id: uid(),
  name: "",
  role: "",
  link: "",
  startDate: "",
  endDate: "",
  description: "",
  bullets: [""],
  tech: [],
});

export const emptySkillGroup = (category = ""): SkillGroup => ({
  id: uid(),
  category,
  items: [],
});

export const emptyCertification = (): Certification => ({
  id: uid(),
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  url: "",
});

export const emptyLanguage = (): LanguageItem => ({
  id: uid(),
  name: "",
  level: "B2",
});

export const emptyCustomSection = (): CustomSection => ({
  id: uid(),
  title: "Additional Section",
  entries: [
    {
      id: uid(),
      heading: "",
      subheading: "",
      location: "",
      startDate: "",
      endDate: "",
      bullets: [""],
    },
  ],
});

export const emptyCV = (name = "Untitled CV"): CVData => ({
  schemaVersion: CV_SCHEMA_VERSION,
  id: uid(),
  name,
  personal: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  },
  summary: "",
  skills: [emptySkillGroup("Core Skills")],
  experience: [emptyExperience()],
  education: [emptyEducation()],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  customSections: [],
  sections: defaultSections(),
  design: defaultDesign(),
  meta: { targetRole: "", targetCompany: "", jobDescription: "" },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

/**
 * A filled-in example that already satisfies the ATS rules the scorer checks
 * for, so a new user can see what "good" looks like before editing.
 */
export const sampleCV = (): CVData => {
  const base = emptyCV("Software Engineer — Remote");
  return {
    ...base,
    personal: {
      fullName: "Haldun Mammadzada",
      title: "Senior Software Engineer",
      email: "you@example.com",
      phone: "+994 50 000 00 00",
      location: "Baku, Azerbaijan (Remote)",
      website: "yourdomain.com",
      linkedin: "linkedin.com/in/yourname",
      github: "github.com/yourname",
    },
    summary:
      "Senior software engineer with 6+ years building and scaling production web applications with TypeScript, React and Node.js. Led the rebuild of a checkout flow that lifted conversion by 18% and cut p95 latency from 1.4s to 380ms. Comfortable owning a feature end to end, from database schema to accessible UI, in fully remote and distributed teams.",
    skills: [
      {
        id: uid(),
        category: "Languages",
        items: ["TypeScript", "JavaScript", "SQL", "Python"],
      },
      {
        id: uid(),
        category: "Frontend",
        items: ["React", "Next.js", "Redux Toolkit", "Tailwind CSS", "Vitest"],
      },
      {
        id: uid(),
        category: "Backend",
        items: ["Node.js", "Express", "PostgreSQL", "Redis", "REST", "GraphQL"],
      },
      {
        id: uid(),
        category: "Cloud & DevOps",
        items: ["AWS", "Docker", "GitHub Actions", "Terraform", "Vercel"],
      },
    ],
    experience: [
      {
        id: uid(),
        role: "Senior Software Engineer",
        company: "Acme Technologies",
        location: "Remote",
        employmentType: "Full-time",
        startDate: "2022-03",
        endDate: "",
        current: true,
        bullets: [
          "Rebuilt the checkout flow in Next.js and TypeScript, increasing conversion by 18% and reducing p95 page load from 1.4s to 380ms.",
          "Designed a PostgreSQL schema and caching layer that cut average API response time by 62% while serving 2M requests per day.",
          "Mentored 4 engineers through code review and pairing, reducing average pull request cycle time from 3 days to 8 hours.",
          "Introduced automated testing with Vitest and Playwright, raising coverage from 21% to 78% and eliminating recurring release regressions.",
        ],
        tech: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "AWS"],
      },
      {
        id: uid(),
        role: "Software Engineer",
        company: "Nordwind Digital",
        location: "Baku, Azerbaijan",
        employmentType: "Full-time",
        startDate: "2019-08",
        endDate: "2022-02",
        current: false,
        bullets: [
          "Delivered 12 client-facing features for a logistics dashboard used by 40,000 monthly active users.",
          "Migrated a legacy jQuery codebase to React, cutting bundle size by 45% and halving time-to-interactive.",
          "Automated the deployment pipeline with GitHub Actions and Docker, reducing release time from 2 hours to 11 minutes.",
        ],
        tech: ["React", "Node.js", "Docker", "MongoDB"],
      },
    ],
    education: [
      {
        id: uid(),
        degree: "Bachelor of Science",
        field: "Computer Science",
        school: "Baku State University",
        location: "Baku, Azerbaijan",
        startDate: "2015-09",
        endDate: "2019-06",
        current: false,
        gpa: "",
        details: "",
      },
    ],
    projects: [
      {
        id: uid(),
        name: "OpenResume Analyzer",
        role: "Creator",
        link: "github.com/yourname/openresume-analyzer",
        startDate: "2024-01",
        endDate: "",
        description:
          "Open-source tool that scores resumes against job descriptions and reports missing keywords.",
        bullets: [
          "Used by 1,200+ developers with 340 GitHub stars in the first six months.",
        ],
        tech: ["TypeScript", "Next.js", "Supabase"],
      },
    ],
    certifications: [
      {
        id: uid(),
        name: "AWS Certified Solutions Architect – Associate",
        issuer: "Amazon Web Services",
        issueDate: "2023-05",
        expiryDate: "2026-05",
        credentialId: "",
        url: "",
      },
    ],
    languages: [
      { id: uid(), name: "Azerbaijani", level: "Native" },
      { id: uid(), name: "English", level: "C1" },
      { id: uid(), name: "Turkish", level: "C1" },
      { id: uid(), name: "Russian", level: "B2" },
    ],
    meta: {
      targetRole: "Senior Software Engineer",
      targetCompany: "",
      jobDescription: "",
    },
  };
};
