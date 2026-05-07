"use client";

import React from "react";
import { useResumeStore }    from "@/stores/resume.store";
import { useCustomizeStore, FONT_WEIGHT_MAP } from "@/stores/customize.store";
import type { TextSettings, LayoutSettings } from "@/stores/customize.store";
import type { TemplateProps } from "./templates/types";
import type { Resume } from "@/types/resume";

// Static registry — all 50 pre-built templates (handcrafted + engine-generated).
// Importing here is safe on the client; the registry is pure React components.
import { TEMPLATE_REGISTRY } from "./templates";

// ── CSS variable bridge ───────────────────────────────────────────────────────

function buildCSSVars(text: TextSettings, layout: LayoutSettings): React.CSSProperties {
  return {
    "--font-primary":    text.primaryFont,
    "--font-secondary":  text.secondaryFont,
    "--size-h1":         `${text.primaryHeadingSize}pt`,
    "--size-h2":         `${text.secondaryHeadingSize}pt`,
    "--size-body":       `${text.bodySize}pt`,
    "--size-section":    `${text.sectionTitleSize}pt`,
    "--weight-h1":       String(FONT_WEIGHT_MAP[text.primaryHeadingWeight]),
    "--weight-h2":       String(FONT_WEIGHT_MAP[text.secondaryHeadingWeight]),
    "--weight-body":     String(FONT_WEIGHT_MAP[text.bodyWeight]),
    "--line-height":     String(text.lineHeight / 100),
    "--margin-top":      `${layout.topBottom}in`,
    "--margin-lr":       `${layout.leftRight}in`,
    "--gap-sections":    `${layout.betweenSections}pt`,
    "--gap-title":       `${layout.betweenTitlesContent}pt`,
    "--gap-content-blocks": `${layout.betweenContentBlocks}pt`,
    "--gap-inside":      `${layout.insideContentBlock}pt`,
  } as React.CSSProperties;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ResumePreviewProps {
  watermark?: boolean;
}

export function ResumePreview({ watermark = false }: ResumePreviewProps) {
  const { resume, sectionOrder } = useResumeStore();
  const { mainColor, text, layout } = useCustomizeStore();

  if (!resume) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Loading preview…
      </div>
    );
  }

  const cssVars = buildCSSVars(text, layout);

  // Look up in static registry (covers all 50 pre-built templates).
  const Component = (TEMPLATE_REGISTRY as Record<string, React.FC<TemplateProps>>)[resume.templateId];

  const templateProps: TemplateProps = {
    resume,
    mainColor,
    dateFormat:       layout.dateFormat,
    headerAlignment:  layout.headerAlignment,
    skillsLayout:     layout.skillsLayout,
    skillsColumns:    layout.skillsColumns,
    educationLayout:  layout.educationLayout,
    educationShowBy:  layout.educationShowBy,
    sectionOrder:     sectionOrder ?? undefined,
  };

  if (Component) {
    return (
      <div
        style={{ ...cssVars, position: "relative", background: "white" }}
        className={watermark ? "watermark" : undefined}
      >
        <Component {...templateProps} />
      </div>
    );
  }

  // Fallback — basic preview while a DB-only template is not yet loaded.
  return (
    <div
      style={{ ...cssVars, position: "relative", background: "white" }}
      className={watermark ? "watermark" : undefined}
    >
      <FallbackPreview resume={resume} />
    </div>
  );
}

// ── Fallback (shown when templateId isn't in static registry) ─────────────────

function FallbackPreview({ resume }: { resume: Resume }) {
  const info = resume.personalInfo;
  const name = [info.firstName, info.lastName].filter(Boolean).join(" ") || "Your Name";

  return (
    <div style={{ fontFamily: "var(--font-secondary, Arial)", fontSize: "var(--size-body, 10pt)", color: "#1a1a1a", lineHeight: "var(--line-height, 1.4)", minHeight: "1123px", padding: "var(--margin-top, 0.5in) var(--margin-lr, 0.5in)" }}>
      <h1 style={{ fontFamily: "var(--font-primary, Georgia)", fontSize: "var(--size-h1, 26pt)", fontWeight: 700, margin: "0 0 4pt", color: "#111" }}>{name}</h1>
      {info.headline && <p style={{ fontSize: "var(--size-h2, 13pt)", color: "#555", margin: "0 0 4pt" }}>{info.headline}</p>}
      <div style={{ fontSize: "8.5pt", color: "#666", marginBottom: "14pt" }}>
        {[info.email, info.phone, info.location, info.linkedinUrl].filter(Boolean).join("  ·  ")}
      </div>
      {resume.summary && (
        <section style={{ marginBottom: "12pt" }}>
          <div style={{ fontSize: "var(--size-section, 11pt)", fontWeight: 700, borderBottom: "1.5px solid #4A6CF7", paddingBottom: "3pt", marginBottom: "var(--gap-title, 5pt)" }}>Summary</div>
          <p style={{ margin: 0 }}>{resume.summary}</p>
        </section>
      )}
      {resume.experiences.length > 0 && (
        <section style={{ marginBottom: "12pt" }}>
          <div style={{ fontSize: "var(--size-section, 11pt)", fontWeight: 700, borderBottom: "1.5px solid #4A6CF7", paddingBottom: "3pt", marginBottom: "var(--gap-title, 5pt)" }}>Experience</div>
          {resume.experiences.map((e) => (
            <div key={e.id} style={{ marginBottom: "var(--gap-content-blocks, 6pt)" }}>
              <strong>{e.title}</strong>{e.company ? ` — ${e.company}` : ""}
              {e.bullets.length > 0 && <ul style={{ margin: "2pt 0 0", paddingLeft: "14pt" }}>{e.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}
      {resume.skills.length > 0 && (
        <section>
          <div style={{ fontSize: "var(--size-section, 11pt)", fontWeight: 700, borderBottom: "1.5px solid #4A6CF7", paddingBottom: "3pt", marginBottom: "var(--gap-title, 5pt)" }}>Skills</div>
          <div>{resume.skills.map((s) => s.name).join(" · ")}</div>
        </section>
      )}
    </div>
  );
}
