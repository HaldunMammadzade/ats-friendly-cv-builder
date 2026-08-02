/**
 * Lexicons used by the ATS scorer and the job-description matcher.
 * Everything is lower-case; callers normalise before lookup.
 */

/** Verbs that read as ownership and impact rather than description. */
export const ACTION_VERBS = new Set([
  "accelerated", "achieved", "acquired", "adapted", "administered", "advanced",
  "advised", "advocated", "analyzed", "architected", "assembled", "assessed",
  "audited", "authored", "automated", "balanced", "benchmarked", "boosted",
  "brokered", "budgeted", "built", "calculated", "campaigned", "captured",
  "centralized", "chaired", "championed", "clarified", "closed", "coached",
  "collaborated", "compiled", "completed", "composed", "conceived", "condensed",
  "conducted", "configured", "consolidated", "constructed", "consulted",
  "containerized", "contracted", "converted", "coordinated", "created",
  "cultivated", "cut", "debugged", "decreased", "defined", "delivered",
  "demonstrated", "deployed", "designed", "detected", "determined", "developed",
  "devised", "diagnosed", "directed", "documented", "doubled", "drafted",
  "drove", "earned", "edited", "educated", "eliminated", "enabled", "enforced",
  "engineered", "enhanced", "established", "evaluated", "examined", "executed",
  "expanded", "expedited", "facilitated", "finalized", "forecast", "formulated",
  "founded", "generated", "guided", "halved", "handled", "headed", "hired",
  "identified", "implemented", "improved", "increased", "influenced",
  "initiated", "innovated", "inspected", "installed", "instituted",
  "instrumented", "integrated", "introduced", "invented", "investigated",
  "launched", "led", "leveraged", "maintained", "managed", "mapped",
  "marketed", "mastered", "maximized", "measured", "mediated", "mentored",
  "merged", "migrated", "minimized", "mobilized", "modeled", "modernized",
  "monitored", "negotiated", "onboarded", "operated", "optimized",
  "orchestrated", "organized", "overhauled", "oversaw", "owned", "partnered",
  "performed", "pioneered", "planned", "prepared", "presented", "prevented",
  "prioritized", "processed", "produced", "programmed", "projected",
  "promoted", "prototyped", "provisioned", "published", "quantified",
  "raised", "ranked", "rearchitected", "rebuilt", "recovered", "recruited",
  "redesigned", "reduced", "refactored", "reengineered", "regulated",
  "reinforced", "remodeled", "removed", "reorganized", "replaced", "reported",
  "researched", "resolved", "restructured", "revamped", "reviewed", "revised",
  "revitalized", "saved", "scaled", "scheduled", "secured", "selected",
  "shaped", "shipped", "simplified", "solved", "sourced", "spearheaded",
  "specified", "stabilized", "standardized", "steered", "streamlined",
  "strengthened", "structured", "supervised", "supported", "surpassed",
  "surveyed", "sustained", "synthesized", "systematized", "targeted",
  "taught", "tested", "tracked", "trained", "transformed", "translated",
  "tripled", "troubleshot", "unified", "upgraded", "validated", "verified",
  "won", "wrote",
]);

/** Phrases that dilute a bullet. Each maps to a concrete rewrite hint. */
export const WEAK_PHRASES: { phrase: string; fix: string }[] = [
  { phrase: "responsible for", fix: "start with what you did: \"Owned…\", \"Led…\", \"Built…\"" },
  { phrase: "duties included", fix: "replace with an action verb and a result" },
  { phrase: "tasked with", fix: "state the outcome instead of the assignment" },
  { phrase: "worked on", fix: "say what you built, shipped or improved" },
  { phrase: "helped with", fix: "name your specific contribution" },
  { phrase: "assisted with", fix: "name your specific contribution" },
  { phrase: "involved in", fix: "state your role and its result" },
  { phrase: "participated in", fix: "state your role and its result" },
  { phrase: "in charge of", fix: "use \"Led\" or \"Owned\" plus the outcome" },
  { phrase: "familiar with", fix: "show it through a project or result instead" },
  { phrase: "exposure to", fix: "show it through a project or result instead" },
  { phrase: "various tasks", fix: "list the two or three that mattered most" },
  { phrase: "team player", fix: "prove collaboration with a concrete example" },
  { phrase: "hard worker", fix: "prove it with an outcome, not an adjective" },
  { phrase: "go-getter", fix: "remove — recruiters read this as filler" },
  { phrase: "think outside the box", fix: "remove — describe the idea you shipped" },
  { phrase: "results-driven", fix: "remove the label and show the result" },
  { phrase: "detail-oriented", fix: "remove the label and show the evidence" },
  { phrase: "self-starter", fix: "show initiative through something you started" },
  { phrase: "synergy", fix: "remove — corporate filler" },
  { phrase: "dynamic professional", fix: "remove — say what you actually do" },
];

/** First-person markers. Resumes are written in implied first person. */
export const PRONOUNS = new Set([
  "i", "me", "my", "mine", "myself", "we", "our", "ours", "us",
]);

export const STOP_WORDS = new Set([
  "a", "about", "above", "across", "after", "again", "against", "all", "also",
  "am", "an", "and", "any", "are", "as", "at", "be", "because", "been",
  "before", "being", "below", "between", "both", "but", "by", "can", "could",
  "did", "do", "does", "doing", "down", "during", "each", "etc", "few", "for",
  "from", "further", "had", "has", "have", "having", "he", "her", "here",
  "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it",
  "its", "itself", "just", "like", "may", "me", "might", "more", "most",
  "must", "my", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
  "or", "other", "our", "ours", "out", "over", "own", "per", "plus", "same",
  "shall", "she", "should", "so", "some", "such", "than", "that", "the",
  "their", "theirs", "them", "then", "there", "these", "they", "this",
  "those", "through", "to", "too", "under", "until", "up", "upon", "us",
  "use", "used", "using", "very", "via", "was", "we", "well", "were", "what",
  "when", "where", "which", "while", "who", "whom", "why", "will", "with",
  "within", "would", "you", "your", "yours",
  // Job-posting boilerplate that is never a real requirement.
  "ability", "applicant", "applicants", "apply", "benefits", "candidate",
  "candidates", "company", "culture", "employer", "environment", "equal",
  "experience", "job", "join", "looking", "must", "offer", "opportunity",
  "position", "preferred", "required", "requirements", "responsibilities",
  "role", "salary", "seeking", "skills", "team", "us", "we", "work",
  "working", "years", "you", "your",
]);

/**
 * Canonical skill name -> surface forms seen in postings and resumes.
 * Used so "JS", "Javascript" and "ECMAScript" all count as one match.
 */
export const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6", "es2015", "vanilla js"],
  typescript: ["ts"],
  react: ["react.js", "reactjs"],
  "next.js": ["nextjs", "next js"],
  "node.js": ["nodejs", "node"],
  "vue.js": ["vue", "vuejs"],
  angular: ["angularjs", "angular 2+"],
  svelte: ["sveltekit"],
  python: ["py"],
  "c#": ["csharp", "c sharp", ".net", "dotnet"],
  java: ["java se", "java ee", "j2ee"],
  go: ["golang"],
  "ruby on rails": ["rails", "ror"],
  php: ["php8"],
  postgresql: ["postgres", "psql"],
  mysql: ["my sql"],
  mongodb: ["mongo"],
  redis: ["redis cache"],
  elasticsearch: ["elastic search", "opensearch"],
  graphql: ["gql", "apollo"],
  rest: ["restful", "rest api", "rest apis"],
  grpc: ["g-rpc"],
  aws: ["amazon web services", "ec2", "s3", "lambda"],
  azure: ["microsoft azure"],
  gcp: ["google cloud", "google cloud platform"],
  docker: ["containerization", "containers"],
  kubernetes: ["k8s", "eks", "gke", "aks"],
  terraform: ["iac", "infrastructure as code"],
  "ci/cd": ["cicd", "continuous integration", "continuous delivery", "continuous deployment"],
  "github actions": ["gh actions"],
  jenkins: ["jenkins ci"],
  git: ["version control", "gitlab", "bitbucket"],
  jest: ["jestjs"],
  playwright: ["e2e testing"],
  cypress: ["cypress.io"],
  "unit testing": ["unit tests", "tdd", "test driven development"],
  agile: ["scrum", "kanban", "sprint planning"],
  "tailwind css": ["tailwind", "tailwindcss"],
  "css": ["css3", "scss", "sass", "less"],
  html: ["html5", "semantic html"],
  accessibility: ["a11y", "wcag"],
  "machine learning": ["ml"],
  "deep learning": ["neural networks"],
  tensorflow: ["tf"],
  pytorch: ["torch"],
  sql: ["t-sql", "pl/sql", "ansi sql"],
  "power bi": ["powerbi"],
  excel: ["microsoft excel", "advanced excel"],
  figma: ["figma design"],
  jira: ["atlassian jira"],
  "microservices": ["microservice architecture"],
  "system design": ["distributed systems"],
  "code review": ["peer review"],
  supabase: ["supabase auth", "supabase db"],
  firebase: ["firestore"],
  redux: ["redux toolkit", "rtk"],
  webpack: ["bundler"],
  vite: ["vitejs"],
  linux: ["unix", "bash", "shell scripting"],
};

/** Reverse index: surface form -> canonical name. */
export const ALIAS_TO_CANONICAL: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    map.set(canonical, canonical);
    for (const alias of aliases) map.set(alias, canonical);
  }
  return map;
})();

/** Recognised so the scorer can flag a skills list that is all soft skills. */
export const SOFT_SKILLS = new Set([
  "communication", "leadership", "teamwork", "collaboration", "problem solving",
  "critical thinking", "time management", "adaptability", "creativity",
  "attention to detail", "work ethic", "interpersonal", "mentoring",
  "presentation", "negotiation", "conflict resolution", "organization",
  "flexibility", "empathy", "ownership", "accountability",
]);

/**
 * Non-standard headings that many parsers fail to map to a known section.
 * Key is the creative label, value is the safe equivalent.
 */
export const RISKY_HEADINGS: Record<string, string> = {
  "my journey": "Work Experience",
  "where i've been": "Work Experience",
  "career story": "Work Experience",
  "what i do": "Professional Summary",
  "about me": "Professional Summary",
  "my toolkit": "Skills",
  "superpowers": "Skills",
  "things i know": "Skills",
  "book smarts": "Education",
  "credentials": "Certifications",
};

/** Glyphs that routinely garble in plain-text extraction. */
export const RISKY_CHARACTERS =
  /[\u2022\u25CF\u25AA\u2023\u2043]|[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;
