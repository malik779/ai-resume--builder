// ─────────────────────────────────────────────────────────────────────────────
// Resume domain types — the canonical shape used throughout the app.
// These are separate from Prisma-generated types so UI is DB-agnostic.
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  headline?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
  order: number;
  relevanceScore?: number;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
  honors?: string;
  activities?: string;
  order: number;
}

export interface Skill {
  name: string;
  category?: "technical" | "soft" | "language" | "tool";
  level?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  bullets: string[];
  url?: string;
  repoUrl?: string;
  techStack: string[];
  startDate?: string;
  endDate?: string;
  order: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  name: string;
  proficiency: "basic" | "conversational" | "professional" | "native";
}

export interface CustomSection {
  id: string;
  title: string;
  items: Array<{ title: string; subtitle?: string; date?: string; description?: string }>;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  isDefault: boolean;
  personalInfo: PersonalInfo;
  summary?: string;
  experiences: WorkExperience[];
  educations: Education[];
  projects: Project[];
  skills: Skill[];
  certifications: Certification[];
  languages: Language[];
  awards: { title: string; issuer?: string; date?: string; description?: string }[];
  customSections: CustomSection[];
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ResumeSection = keyof Pick<Resume, "summary" | "experiences" | "educations" | "projects" | "skills" | "certifications">;

export interface ResumeVersion {
  id: string;
  resumeId: string;
  version: number;
  label?: string;
  snapshot: Resume;
  createdAt: Date;
}

// Template IDs
export type TemplateId = "modern" | "professional" | "minimal" | "creative" | "ats-optimized" | "executive" | "technical" | "designer";

export const TEMPLATE_META: Record<TemplateId, { name: string; description: string; previewColor: string }> = {
  "modern": { name: "Modern", description: "Clean two-column layout with color accents", previewColor: "#3B82F6" },
  "professional": { name: "Professional", description: "Traditional single-column, Fortune 500 ready", previewColor: "#1E3A5F" },
  "minimal": { name: "Minimal", description: "Maximum white space, typography-focused", previewColor: "#6B7280" },
  "creative": { name: "Creative", description: "Bold design for creative industries", previewColor: "#8B5CF6" },
  "ats-optimized": { name: "ATS-Optimized", description: "Plain text structure for maximum ATS compatibility", previewColor: "#059669" },
  "executive": { name: "Executive", description: "Premium layout for senior leadership roles", previewColor: "#92400E" },
  "technical": { name: "Technical", description: "Skills-forward layout for engineers", previewColor: "#0F172A" },
  "designer": { name: "Designer", description: "Portfolio-style for UX/UI and design roles", previewColor: "#EC4899" },
};
