import React from "react";
import type { Resume } from "@/types/resume";
import type { RenderCtx } from "./types";
import { ContactSection }        from "./ContactSection";
import { SummarySection }        from "./SummarySection";
import { ExperienceSection }     from "./ExperienceSection";
import { EducationSection }      from "./EducationSection";
import { SkillsSection }         from "./SkillsSection";
import { ProjectsSection }       from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";
import { LanguagesSection }      from "./LanguagesSection";

export type { RenderCtx } from "./types";
export { SectionTitle }    from "./SectionTitle";
export { SidebarLabel }    from "./SidebarLabel";

type SectionFn = (resume: Resume, ctx: RenderCtx, key: string) => React.ReactNode;

export const SECTION_RENDERERS: Record<string, SectionFn> = {
  contact:        (r, c, k) => React.createElement(ContactSection,        { key: k, resume: r, ctx: c }),
  summary:        (r, c, k) => React.createElement(SummarySection,        { key: k, resume: r, ctx: c }),
  experience:     (r, c, k) => React.createElement(ExperienceSection,     { key: k, resume: r, ctx: c }),
  education:      (r, c, k) => React.createElement(EducationSection,      { key: k, resume: r, ctx: c }),
  skills:         (r, c, k) => React.createElement(SkillsSection,         { key: k, resume: r, ctx: c }),
  projects:       (r, c, k) => React.createElement(ProjectsSection,       { key: k, resume: r, ctx: c }),
  certifications: (r, c, k) => React.createElement(CertificationsSection, { key: k, resume: r, ctx: c }),
  languages:      (r, c, k) => React.createElement(LanguagesSection,      { key: k, resume: r, ctx: c }),
};

/** All known section keys in default display order */
export const ALL_SECTION_KEYS = [
  "summary", "experience", "education", "projects",
  "skills", "certifications", "languages", "contact",
] as const;

export type SectionKey = typeof ALL_SECTION_KEYS[number];

/** Default regions for single-column layouts */
export const DEFAULT_SINGLE_REGIONS: string[] = [
  "summary", "experience", "education", "projects", "skills", "certifications", "languages",
];

/** Default regions for layouts that have a sidebar */
export const DEFAULT_MAIN_REGIONS: string[]    = ["summary", "experience", "education", "projects"];
export const DEFAULT_SIDEBAR_REGIONS: string[] = ["contact", "skills", "certifications", "languages"];
