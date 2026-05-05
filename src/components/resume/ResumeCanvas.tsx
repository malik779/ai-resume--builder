"use client";

import { useMemo } from "react";
import { useCustomizeStore, FONT_WEIGHT_MAP } from "@/stores/customize.store";
import { useResumeStore } from "@/stores/resume.store";
import { TEMPLATE_REGISTRY } from "./templates";
import { resolveTemplateId } from "@/types/resume";
import type { TemplateId } from "@/types/resume";

const GOOGLE_FONTS: Record<string, string> = {
  "Lato":             "Lato:wght@300;400;700;900",
  "Merriweather":     "Merriweather:wght@300;400;700;900",
  "Montserrat":       "Montserrat:wght@300;400;500;600;700;800",
  "Open Sans":        "Open+Sans:wght@300;400;600;700",
  "Playfair Display": "Playfair+Display:wght@400;600;700",
  "Raleway":          "Raleway:wght@300;400;500;600;700",
  "Roboto":           "Roboto:wght@300;400;500;700",
  "Source Sans Pro":  "Source+Sans+3:wght@300;400;600;700",
};

function getFontStack(name: string): string {
  const fallback = ["Georgia", "Playfair Display", "Merriweather"].includes(name)
    ? "Georgia, 'Times New Roman', serif"
    : "Arial, Helvetica, sans-serif";
  return `'${name}', ${fallback}`;
}

function useFontLoader(fonts: string[]) {
  useMemo(() => {
    if (typeof document === "undefined") return;
    fonts.forEach((font) => {
      const query = GOOGLE_FONTS[font];
      if (!query) return;
      const id = `gf-${font.replace(/\s/g, "-").toLowerCase()}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
      document.head.appendChild(link);
    });
  }, [fonts.join(",")]);
}

interface ResumeCanvasProps {
  /** 0–1 scale for the preview. Default = 1 (full size 794px wide). */
  scale?: number;
  /** When true, renders a fully interactive print-ready canvas. */
  printMode?: boolean;
}

export function ResumeCanvas({ scale = 1, printMode = false }: ResumeCanvasProps) {
  const resume = useResumeStore((s) => s.resume);
  const sectionOrder = useResumeStore((s) => s.sectionOrder);
  const { templateId: storeTemplateId, mainColor, text, layout } = useCustomizeStore();

  // Resolve templateId: customize store wins, but fall back to resume's saved templateId
  const templateId = resolveTemplateId(storeTemplateId ?? resume?.templateId ?? "classic") as TemplateId;

  // Load Google Fonts that aren't system fonts
  useFontLoader([text.primaryFont, text.secondaryFont]);

  const canvasHeight = layout.format === "A4" ? 1123 : 1056; // px at 96dpi

  const cssVars: React.CSSProperties = {
    "--accent-color":   mainColor,
    "--font-primary":   getFontStack(text.primaryFont),
    "--font-secondary": getFontStack(text.secondaryFont),
    "--line-height":    `${text.lineHeight / 100}`,
    "--size-h1":        `${text.primaryHeadingSize}pt`,
    "--size-h2":        `${text.secondaryHeadingSize}pt`,
    "--size-body":      `${text.bodySize}pt`,
    "--size-section":   `${text.sectionTitleSize}pt`,
    "--weight-h1":      `${FONT_WEIGHT_MAP[text.primaryHeadingWeight]}`,
    "--weight-h2":      `${FONT_WEIGHT_MAP[text.secondaryHeadingWeight]}`,
    "--weight-body":    `${FONT_WEIGHT_MAP[text.bodyWeight]}`,
    "--margin-top":     `${layout.topBottom}in`,
    "--margin-lr":      `${layout.leftRight}in`,
    "--gap-sections":   `${layout.betweenSections}pt`,
    "--gap-title":      `${layout.betweenTitlesContent}pt`,
    "--gap-content-blocks": `${layout.betweenContentBlocks}pt`,
    "--gap-inside":     `${layout.insideContentBlock}pt`,
  } as React.CSSProperties;

  const TemplateComponent = TEMPLATE_REGISTRY[templateId] ?? TEMPLATE_REGISTRY["classic"];

  if (!resume) return null;

  const canvas = (
    <div
      id="resume-canvas"
      style={{
        width: "794px",
        minHeight: `${canvasHeight}px`,
        background: "white",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        ...cssVars,
      }}
    >
      <TemplateComponent
        resume={resume}
        mainColor={mainColor}
        dateFormat={layout.dateFormat}
        headerAlignment={layout.headerAlignment}
        skillsLayout={layout.skillsLayout}
        skillsColumns={layout.skillsColumns}
        educationLayout={layout.educationLayout}
        educationShowBy={layout.educationShowBy}
        sectionOrder={sectionOrder}
      />
    </div>
  );

  if (printMode) return canvas;

  return (
    <div
      style={{
        width: `${794 * scale}px`,
        height: `${canvasHeight * scale}px`,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {canvas}
      </div>
    </div>
  );
}

/** Thumbnail version — renders at ~0.23 scale inside a fixed-size card */
export function ResumeCanvasThumbnail({ templateId: overrideTemplateId, mainColor: overrideColor }: { templateId?: TemplateId; mainColor?: string }) {
  const resume = useResumeStore((s) => s.resume);
  const { templateId: storeTemplateId, mainColor: storeColor, text, layout } = useCustomizeStore();

  const templateId = resolveTemplateId(overrideTemplateId ?? storeTemplateId ?? "classic") as TemplateId;
  const mainColor = overrideColor ?? storeColor;

  const cssVars: React.CSSProperties = {
    "--accent-color":   mainColor,
    "--font-primary":   getFontStack(text.primaryFont),
    "--font-secondary": getFontStack(text.secondaryFont),
    "--line-height":    `${text.lineHeight / 100}`,
    "--size-h1":        `${text.primaryHeadingSize}pt`,
    "--size-h2":        `${text.secondaryHeadingSize}pt`,
    "--size-body":      `${text.bodySize}pt`,
    "--size-section":   `${text.sectionTitleSize}pt`,
    "--weight-h1":      `${FONT_WEIGHT_MAP[text.primaryHeadingWeight]}`,
    "--weight-h2":      `${FONT_WEIGHT_MAP[text.secondaryHeadingWeight]}`,
    "--weight-body":    `${FONT_WEIGHT_MAP[text.bodyWeight]}`,
    "--margin-top":     `${layout.topBottom}in`,
    "--margin-lr":      `${layout.leftRight}in`,
    "--gap-sections":   `${layout.betweenSections}pt`,
    "--gap-title":      `${layout.betweenTitlesContent}pt`,
    "--gap-content-blocks": `${layout.betweenContentBlocks}pt`,
    "--gap-inside":     `${layout.insideContentBlock}pt`,
  } as React.CSSProperties;

  const TemplateComponent = TEMPLATE_REGISTRY[templateId] ?? TEMPLATE_REGISTRY["classic"];

  const SCALE = 0.225;
  const W = 794;
  const H = 1123;

  return (
    <div style={{ width: `${W * SCALE}px`, height: `${H * SCALE}px`, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ transform: `scale(${SCALE})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <div style={{ width: `${W}px`, minHeight: `${H}px`, background: "white", boxSizing: "border-box", overflow: "hidden", ...cssVars }}>
          <TemplateComponent
            resume={resume ?? EMPTY_RESUME}
            mainColor={mainColor}
            dateFormat={layout.dateFormat}
            headerAlignment={layout.headerAlignment}
            skillsLayout={layout.skillsLayout}
            skillsColumns={layout.skillsColumns}
            educationLayout={layout.educationLayout}
            educationShowBy={layout.educationShowBy}
          />
        </div>
      </div>
    </div>
  );
}

// Fallback resume data for thumbnail previews when no resume is loaded
import type { Resume } from "@/types/resume";
const EMPTY_RESUME: Resume = {
  id: "preview", userId: "preview", title: "Resume",
  templateId: "classic", isDefault: false,
  personalInfo: { firstName: "Herman", lastName: "Walton", headline: "Financial Analyst", email: "herman@example.com", phone: "(412) 479-6342", location: "New York, NY 10021" },
  summary: "Experienced and driven Financial Analyst with an impressive background of managing multi-million dollar budgets while providing analysis and account support within product development department.",
  experiences: [
    { id: "1", company: "GEO Corp.", title: "Financial Analyst", location: "New York", startDate: "2012-01", endDate: "", current: true, order: 0, bullets: ["Created budgets and ensured that labor and material costs were decreased by 1% percent.", "Created financial reports on completed projects, indicating advantageous results."] },
    { id: "2", company: "Sisco Enterprises", title: "Financial Analyst", location: "", startDate: "2008-02", endDate: "2012-12", current: false, order: 1, bullets: ["Designed and applied a different type of software to enhance communication of different organization."] },
  ],
  educations: [
    { id: "e1", institution: "University of Arizona", degree: "Diploma in Computer Engineering", field: "", startDate: "2004-08", endDate: "2008-10", current: false, order: 0 },
  ],
  skills: [{ name: "Solution Strategies" }, { name: "Analytical Thinker" }, { name: "Innovation" }, { name: "Effective Team Leader" }, { name: "Market Assessment" }, { name: "Collaboration" }],
  projects: [], certifications: [], languages: [], awards: [], customSections: [],
  createdAt: new Date(), updatedAt: new Date(),
};
