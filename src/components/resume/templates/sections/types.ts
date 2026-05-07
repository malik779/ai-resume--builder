import type { SectionStyle } from "../engine";
import type { DateFormat } from "@/stores/customize.store";

/**
 * Context passed to every section renderer. Encapsulates all styling decisions
 * so section components stay free of direct store dependencies.
 */
export interface RenderCtx {
  accent: string;
  sectionStyle: SectionStyle;
  dateFormat: DateFormat;
  uppercase: boolean;
  bulletChar: string;
  variant: "main" | "sidebar";

  // Sidebar color tokens — only meaningful when variant === "sidebar"
  sbText: string;     // primary text
  sbMuted: string;    // secondary / muted text
  sbLabel: string;    // section label (uppercase tiny)
  sbDivider: string;  // divider line between sidebar sections

  skillsLayout: "inline" | "columns";
  skillsColumns: number;
}
