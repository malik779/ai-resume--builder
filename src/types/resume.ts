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
  photoUrl?: string;
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

// Template IDs — 8 handcrafted + 42 engine-generated = 50 total
export type TemplateId =
  // ── Handcrafted ───────────────────────────────────
  | "classic" | "traditional" | "professional" | "prime-ats"
  | "pure-ats" | "specialist" | "clean" | "simple-ats"
  // ── Dark banner (single) ──────────────────────────
  | "executive" | "herald" | "slate" | "monarch"
  // ── Accent banner (single) ────────────────────────
  | "chairman" | "pinnacle" | "velocity" | "nova"
  // ── Two-tone (single) ─────────────────────────────
  | "director" | "zenith" | "forge" | "signal"
  // ── Split header (single) ─────────────────────────
  | "criterion" | "apex" | "vector" | "chrome" | "summit"
  // ── Stack-left (single) ───────────────────────────
  | "atlas" | "lucid" | "harbor" | "grove" | "impact" | "frontier" | "journal" | "canvas"
  // ── Stack-center (single) ─────────────────────────
  | "legacy" | "clarity" | "refined" | "orbit"
  // ── Line-accent (single) ──────────────────────────
  | "meridian" | "flux" | "contour"
  // ── Underbar (single) ─────────────────────────────
  | "epoch" | "element" | "vertex"
  // ── Sidebar-left ──────────────────────────────────
  | "ambassador" | "envoy" | "axiom" | "ledger"
  // ── Sidebar-right ─────────────────────────────────
  | "consul" | "prism" | "chapter";

const ALL_TEMPLATE_IDS: TemplateId[] = [
  "classic","traditional","professional","prime-ats","pure-ats","specialist","clean","simple-ats",
  "executive","herald","slate","monarch",
  "chairman","pinnacle","velocity","nova",
  "director","zenith","forge","signal",
  "criterion","apex","vector","chrome","summit",
  "atlas","lucid","harbor","grove","impact","frontier","journal","canvas",
  "legacy","clarity","refined","orbit",
  "meridian","flux","contour",
  "epoch","element","vertex",
  "ambassador","envoy","axiom","ledger",
  "consul","prism","chapter",
];

// Map old IDs to new (for backward compat)
export const LEGACY_TEMPLATE_MAP: Record<string, TemplateId> = {
  modern: "specialist", minimal: "classic",
  creative: "clean", "ats-optimized": "pure-ats",
  technical: "prime-ats", designer: "specialist",
};

export function resolveTemplateId(id: string): TemplateId {
  if (id in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[id];
  return ALL_TEMPLATE_IDS.includes(id as TemplateId) ? (id as TemplateId) : "classic";
}

export const TEMPLATE_META: Record<
  TemplateId,
  { name: string; description: string; previewColor: string; tags: string[] }
> = {
  // ── Handcrafted ───────────────────────────────────────────────────────────
  "classic":     { name: "Classic",      description: "Timeless single-column with serif elegance",               previewColor: "#1a1a1a", tags: ["free"] },
  "traditional": { name: "Traditional",  description: "Centered formal header for corporate roles",               previewColor: "#1E3A5F", tags: ["free"] },
  "professional":{ name: "Professional", description: "Dark sidebar with photo, Fortune 500 ready",               previewColor: "#1B4332", tags: ["photo","two-column"] },
  "prime-ats":   { name: "Prime ATS",    description: "Two-column header with photo, ATS-friendly",               previewColor: "#1E40AF", tags: ["photo","ats"] },
  "pure-ats":    { name: "Pure ATS",     description: "Zero decoration, maximum ATS compatibility",               previewColor: "#374151", tags: ["ats","free"] },
  "specialist":  { name: "Specialist",   description: "Modern typographic hierarchy with accent bar",             previewColor: "#4A6CF7", tags: [] },
  "clean":       { name: "Clean",        description: "Bold dark header, two-column info density",                previewColor: "#0F172A", tags: ["two-column"] },
  "simple-ats":  { name: "Simple ATS",   description: "Light accent, clean lines, ATS safe",                     previewColor: "#0EA5E9", tags: ["ats","free"] },

  // ── Dark banner ───────────────────────────────────────────────────────────
  "executive":   { name: "Executive",    description: "Dramatic dark banner with classic underline sections",              previewColor: "#111827", tags: [] },
  "herald":      { name: "Herald",       description: "Dark header with bold vertical bar section accents",                previewColor: "#1a1a1a", tags: [] },
  "slate":       { name: "Slate",        description: "Charcoal banner, crisp minimal caps sections",                     previewColor: "#1F2937", tags: [] },
  "monarch":     { name: "Monarch",      description: "Dark executive banner with photo portrait and dot sections",        previewColor: "#111827", tags: ["photo"] },

  // ── Accent banner ─────────────────────────────────────────────────────────
  "chairman":    { name: "Chairman",     description: "Bold color header with photo portrait and uppercase sections",      previewColor: "#374151", tags: ["photo"] },
  "pinnacle":    { name: "Pinnacle",     description: "Color banner, dot-connected section markers",                       previewColor: "#374151", tags: [] },
  "velocity":    { name: "Velocity",     description: "Energy color header with structural left-bar sections",             previewColor: "#374151", tags: [] },
  "nova":        { name: "Nova",         description: "Bright accent banner with classic underline body",                  previewColor: "#374151", tags: [] },

  // ── Two-tone ──────────────────────────────────────────────────────────────
  "director":    { name: "Director",     description: "Dark name strip + accent contact band, underline body",             previewColor: "#1a1a1a", tags: [] },
  "zenith":      { name: "Zenith",       description: "Two-tone header with modern pill section labels",                   previewColor: "#1a1a1a", tags: [] },
  "forge":       { name: "Forge",        description: "Bold two-tone header with vertical bar sections",                   previewColor: "#1a1a1a", tags: [] },
  "signal":      { name: "Signal",       description: "Two-tone header with dot-marker section flow",                      previewColor: "#1a1a1a", tags: [] },

  // ── Split header ──────────────────────────────────────────────────────────
  "criterion":   { name: "Criterion",    description: "Name left, contact right, strong section bars",                     previewColor: "#374151", tags: [] },
  "apex":        { name: "Apex",         description: "Split header with photo portrait and badge section labels",         previewColor: "#374151", tags: ["photo"] },
  "vector":      { name: "Vector",       description: "Split header, minimal uppercase section titles",                    previewColor: "#374151", tags: [] },
  "chrome":      { name: "Chrome",       description: "Split header with photo portrait and overline section accents",    previewColor: "#374151", tags: ["photo"] },
  "summit":      { name: "Summit",       description: "Split header with dot-connected section titles",                    previewColor: "#374151", tags: [] },

  // ── Stack-left ────────────────────────────────────────────────────────────
  "atlas":       { name: "Atlas",        description: "Left-aligned with bold overline section bars",                      previewColor: "#1a1a1a", tags: [] },
  "lucid":       { name: "Lucid",        description: "Clean left header, dot-connected section flow",                     previewColor: "#1a1a1a", tags: [] },
  "harbor":      { name: "Harbor",       description: "Left-aligned with photo portrait and classic underline sections",  previewColor: "#1a1a1a", tags: ["photo"] },
  "grove":       { name: "Grove",        description: "Left header with prominent vertical section bars",                  previewColor: "#1a1a1a", tags: [] },
  "impact":      { name: "Impact",       description: "Accent-colored name, photo portrait, filled section headers",      previewColor: "#1a1a1a", tags: ["photo"] },
  "frontier":    { name: "Frontier",     description: "Left header with flanked centered section titles",                  previewColor: "#1a1a1a", tags: [] },
  "journal":     { name: "Journal",      description: "Clean left header with pill section labels",                        previewColor: "#1a1a1a", tags: [] },
  "canvas":      { name: "Canvas",       description: "Left-aligned header, minimal uppercase sections",                   previewColor: "#1a1a1a", tags: [] },

  // ── Stack-center ──────────────────────────────────────────────────────────
  "legacy":      { name: "Legacy",       description: "Centered formal header with flanked section dividers",              previewColor: "#1a1a1a", tags: [] },
  "clarity":     { name: "Clarity",      description: "Ultra-minimal centered header, caps-only sections",                 previewColor: "#1a1a1a", tags: [] },
  "refined":     { name: "Refined",      description: "Elegant centered header with classic underline sections",           previewColor: "#1a1a1a", tags: [] },
  "orbit":       { name: "Orbit",        description: "Centered header with rounded badge section labels",                 previewColor: "#1a1a1a", tags: [] },

  // ── Line-accent ───────────────────────────────────────────────────────────
  "meridian":    { name: "Meridian",     description: "Accent bar above name with dot-connected sections",                 previewColor: "#1a1a1a", tags: [] },
  "flux":        { name: "Flux",         description: "Accent bar header with flanked section titles",                     previewColor: "#1a1a1a", tags: [] },
  "contour":     { name: "Contour",      description: "Accent bar header with badge section labels",                       previewColor: "#1a1a1a", tags: [] },

  // ── Underbar ──────────────────────────────────────────────────────────────
  "epoch":       { name: "Epoch",        description: "Gradient underline header, minimal cap sections",                   previewColor: "#1a1a1a", tags: [] },
  "element":     { name: "Element",      description: "Gradient underline header, dot-connected sections",                 previewColor: "#1a1a1a", tags: [] },
  "vertex":      { name: "Vertex",       description: "Gradient underline header with structural bar sections",            previewColor: "#1a1a1a", tags: [] },

  // ── Sidebar-left ──────────────────────────────────────────────────────────
  "ambassador":  { name: "Ambassador",   description: "Dark banner, navy sidebar with photo portrait and skills",         previewColor: "#1E2A4A", tags: ["photo","two-column"] },
  "envoy":       { name: "Envoy",        description: "Dark charcoal sidebar with photo portrait and left-bar sections",  previewColor: "#222222", tags: ["photo","two-column"] },
  "axiom":       { name: "Axiom",        description: "Split header, clean light-gray sidebar panel",                     previewColor: "#374151", tags: ["two-column"] },
  "ledger":      { name: "Ledger",       description: "Two-tone header, warm cream sidebar panel",                        previewColor: "#1a1a1a", tags: ["two-column"] },

  // ── Sidebar-right ─────────────────────────────────────────────────────────
  "consul":      { name: "Consul",       description: "Accent banner, solid-color right sidebar with photo portrait",     previewColor: "#374151", tags: ["photo","two-column"] },
  "prism":       { name: "Prism",        description: "Left header, light-gray right sidebar with photo portrait",        previewColor: "#374151", tags: ["photo","two-column"] },
  "chapter":     { name: "Chapter",      description: "Split header, tinted accent right sidebar",                        previewColor: "#374151", tags: ["two-column"] },
};
