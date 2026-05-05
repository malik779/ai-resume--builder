import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TemplateId } from "@/types/resume";
export type { TemplateId } from "@/types/resume";

export type FontWeight = "Thin" | "Light" | "Regular" | "Medium" | "SemiBold" | "Bold" | "ExtraBold";
export type DateFormat = "short" | "long" | "numeric" | "year";
export type TemplateFilter = "all" | "photo" | "two-column" | "ats" | "free";

export const FONT_WEIGHT_MAP: Record<FontWeight, number> = {
  Thin: 100, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800,
};

export const AVAILABLE_FONTS = [
  "Arial", "Calibri", "Georgia", "Helvetica", "Lato", "Merriweather",
  "Montserrat", "Open Sans", "Playfair Display", "Raleway", "Roboto",
  "Source Sans Pro", "Times New Roman", "Trebuchet MS",
];

export const PRESET_COLORS = [
  "#4A6CF7", "#8B5CF6", "#EF4444", "#D97706", "#111827",
  "#059669", "#0EA5E9", "#EC4899",
];

export interface TextSettings {
  primaryFont: string;
  secondaryFont: string;
  lineHeight: number;         // 80–150 (percent)
  primaryHeadingSize: number; // 16–36 pt
  secondaryHeadingSize: number; // 12–24 pt
  bodySize: number;           // 8–14 pt
  sectionTitleSize: number;   // 10–18 pt
  primaryHeadingWeight: FontWeight;
  secondaryHeadingWeight: FontWeight;
  bodyWeight: FontWeight;
}

export interface LayoutSettings {
  format: "A4" | "US_LETTER";
  headerFooter: number;       // 0.1–1.0 in
  topBottom: number;          // 0.1–1.5 in
  leftRight: number;          // 0.1–1.5 in
  betweenSections: number;    // 4–32 pt
  betweenTitlesContent: number; // 2–16 pt
  betweenContentBlocks: number; // 2–16 pt
  insideContentBlock: number; // 1–8 pt
  dateFormat: DateFormat;
  headerAlignment: "left" | "center" | "right";
  skillsLayout: "inline" | "columns";
  skillsColumns: number;      // 2–6
  educationShowBy: "institution" | "degree";
  educationLayout: "stacked" | "inline";
}

const DEFAULT_TEXT: TextSettings = {
  primaryFont: "Georgia",
  secondaryFont: "Arial",
  lineHeight: 115,
  primaryHeadingSize: 26,
  secondaryHeadingSize: 14,
  bodySize: 10,
  sectionTitleSize: 11,
  primaryHeadingWeight: "Bold",
  secondaryHeadingWeight: "Bold",
  bodyWeight: "Regular",
};

const DEFAULT_LAYOUT: LayoutSettings = {
  format: "A4",
  headerFooter: 0.3,
  topBottom: 0.5,
  leftRight: 0.5,
  betweenSections: 14,
  betweenTitlesContent: 5,
  betweenContentBlocks: 6,
  insideContentBlock: 2,
  dateFormat: "short",
  headerAlignment: "left",
  skillsLayout: "inline",
  skillsColumns: 4,
  educationShowBy: "institution",
  educationLayout: "stacked",
};

interface CustomizeState {
  templateId: TemplateId;
  mainColor: string;
  templateFilter: TemplateFilter;
  text: TextSettings;
  layout: LayoutSettings;

  setTemplate: (id: TemplateId) => void;
  setMainColor: (color: string) => void;
  setTemplateFilter: (filter: TemplateFilter) => void;
  updateText: (updates: Partial<TextSettings>) => void;
  updateLayout: (updates: Partial<LayoutSettings>) => void;
  resetText: () => void;
  resetLayout: () => void;
}

export const useCustomizeStore = create<CustomizeState>()(
  persist(
    (set) => ({
      templateId: "classic",
      mainColor: "#4A6CF7",
      templateFilter: "all",
      text: DEFAULT_TEXT,
      layout: DEFAULT_LAYOUT,

      setTemplate: (templateId) => set({ templateId }),
      setMainColor: (mainColor) => set({ mainColor }),
      setTemplateFilter: (templateFilter) => set({ templateFilter }),
      updateText: (updates) => set((s) => ({ text: { ...s.text, ...updates } })),
      updateLayout: (updates) => set((s) => ({ layout: { ...s.layout, ...updates } })),
      resetText: () => set({ text: DEFAULT_TEXT }),
      resetLayout: () => set({ layout: DEFAULT_LAYOUT }),
    }),
    { name: "resume-customize-v1" }
  )
);
