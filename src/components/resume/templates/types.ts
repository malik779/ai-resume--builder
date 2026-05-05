import type { Resume } from "@/types/resume";
import type { DateFormat } from "@/stores/customize.store";

export interface TemplateProps {
  resume: Resume;
  mainColor: string;
  dateFormat: DateFormat;
  headerAlignment: "left" | "center" | "right";
  skillsLayout: "inline" | "columns";
  skillsColumns: number;
  educationLayout: "stacked" | "inline";
  educationShowBy: "institution" | "degree";
  sectionOrder?: string[];
}
