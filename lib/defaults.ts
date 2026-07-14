import { CVData } from "@/types/cv";
import { uid } from "./uid";

export const emptyCV = (name = "New CV"): CVData => ({
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
  skills: [{ id: uid(), category: "Frontend", items: "" }],
  experience: [
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
  education: [
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
  projects: [
    {
      id: uid(),
      name: "",
      link: "",
      description: "",
      tech: "",
    },
  ],
  languages: [{ id: uid(), name: "", level: "" }],
  updatedAt: Date.now(),
});

export const sampleFrontendCV = (): CVData => ({
  ...emptyCV("Frontend Developer"),
  personal: {
    fullName: "Your Name",
    title: "Senior Frontend Developer",
    email: "you@example.com",
    phone: "+994-XX-XXX-XX-XX",
    location: "Baku, Azerbaijan",
    website: "yourwebsite.com",
    linkedin: "linkedin.com/in/yourname",
    github: "github.com/yourname",
  },
  summary:
    "Frontend developer with 5+ years of experience building scalable web applications using React, Next.js, and TypeScript. Strong focus on clean architecture, performance optimization, and pixel-perfect UI implementation.",
  skills: [
    { id: uid(), category: "Frontend", items: "React | Next.js | TypeScript | Redux | Tailwind CSS | Framer Motion" },
    { id: uid(), category: "Tools", items: "Git | Vite | Webpack | Storybook | Jest | Cypress" },
    { id: uid(), category: "Other", items: "REST APIs | GraphQL | Figma | Agile/Scrum" },
  ],
});

export const sampleFullstackCV = (): CVData => ({
  ...emptyCV("Fullstack Developer"),
  personal: {
    fullName: "Your Name",
    title: "Fullstack Developer",
    email: "you@example.com",
    phone: "+994-XX-XXX-XX-XX",
    location: "Baku, Azerbaijan",
    website: "yourwebsite.com",
    linkedin: "linkedin.com/in/yourname",
    github: "github.com/yourname",
  },
  summary:
    "Fullstack developer with 5+ years of experience building end-to-end web applications. Proficient in React/Next.js on the frontend and Node.js/Express on the backend, with hands-on experience in database design and cloud deployment.",
  skills: [
    { id: uid(), category: "Frontend", items: "React | Next.js | TypeScript | Tailwind CSS" },
    { id: uid(), category: "Backend", items: "Node.js | Express | REST APIs | GraphQL" },
    { id: uid(), category: "Database", items: "PostgreSQL | MongoDB | Supabase | Prisma" },
    { id: uid(), category: "DevOps", items: "Docker | Vercel | Git | CI/CD" },
  ],
});
