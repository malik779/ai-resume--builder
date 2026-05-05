import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

// Sections that live in the main (right) column — sidebar always has skills + certifications
const MAIN_SECTIONS = ["summary", "experience", "education"];
const DEFAULT_ORDER = ["summary", "experience", "education"];

export function ProfessionalTemplate({ resume, mainColor, dateFormat, skillsLayout, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);

  const sidebarBg = mainColor;

  const sidebarSection: React.CSSProperties = {
    marginTop: "14pt",
    borderTop: "1px solid rgba(255,255,255,0.25)",
    paddingTop: "10pt",
  };

  const sidebarSectionTitle: React.CSSProperties = {
    fontSize: "8pt",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "6pt",
  };

  const mainSectionHeader: React.CSSProperties = {
    fontSize: "var(--size-section)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: mainColor,
    borderBottom: `1.5px solid ${mainColor}`,
    paddingBottom: "3pt",
    marginBottom: "var(--gap-title)",
    marginTop: "var(--gap-sections)",
  };

  // Only order main-column sections; filter sectionOrder to what this column knows about
  const order = (sectionOrder ?? DEFAULT_ORDER).filter((id) => MAIN_SECTIONS.includes(id));

  const mainSections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={mainSectionHeader}>Profile</div>
        <p style={{ margin: 0, color: "#333", textAlign: "justify" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={mainSectionHeader}>Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <strong style={{ fontSize: "10.5pt", color: "#1a1a1a" }}>{exp.title}</strong>
                <span style={{ marginLeft: "6pt", color: mainColor, fontWeight: 600 }}>{exp.company}</span>
                {exp.location && <span style={{ color: "#888", marginLeft: "5pt", fontSize: "8.5pt" }}>· {exp.location}</span>}
              </div>
              <span style={{ color: "#888", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
                {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}
              </span>
            </div>
            {exp.bullets.length > 0 && (
              <ul style={{ margin: "3pt 0 0 0", paddingLeft: "14pt" }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: "2pt", color: "#333", listStyleType: "disc" }}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </>
    ) : null,

    education: educations.length > 0 ? (
      <>
        <div style={mainSectionHeader}>Education</div>
        {educations.map((edu) => (
          <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--gap-inside)" }}>
            <div>
              <strong>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</strong>
              <span style={{ color: mainColor, marginLeft: "6pt" }}>{edu.institution}</span>
            </div>
            <span style={{ color: "#888", fontSize: "8.5pt", whiteSpace: "nowrap" }}>
              {dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}
            </span>
          </div>
        ))}
      </>
    ) : null,
  };

  return (
    <div style={{ display: "flex", minHeight: "1123px", fontFamily: "var(--font-secondary)", fontSize: "var(--size-body)", lineHeight: "var(--line-height)" }}>
      {/* Left Sidebar — fixed layout, not affected by sectionOrder */}
      <div style={{
        width: "32%",
        background: sidebarBg,
        color: "white",
        padding: "32pt 16pt 24pt",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Photo */}
        <div style={{
          width: "80pt", height: "80pt",
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.5)",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "12pt",
          alignSelf: "center",
          background: "rgba(255,255,255,0.2)",
          flexShrink: 0,
        }}>
          {personalInfo.photoUrl ? (
            <img src={personalInfo.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "28pt", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
              {personalInfo.firstName?.[0] ?? "?"}
            </span>
          )}
        </div>

        <h1 style={{
          fontFamily: "var(--font-primary)",
          fontSize: "15pt",
          fontWeight: "var(--weight-h1)" as any,
          color: "white",
          margin: "0 0 3pt 0",
          textAlign: "center",
          lineHeight: 1.2,
        }}>{name}</h1>
        {personalInfo.headline && (
          <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: "4pt" }}>
            {personalInfo.headline}
          </div>
        )}

        {/* Contact */}
        <div style={sidebarSection}>
          <div style={sidebarSectionTitle}>Contact</div>
          {[
            personalInfo.email && { icon: "✉", text: personalInfo.email },
            personalInfo.phone && { icon: "☎", text: personalInfo.phone },
            personalInfo.location && { icon: "⌖", text: personalInfo.location },
            personalInfo.linkedinUrl && { icon: "in", text: personalInfo.linkedinUrl },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} style={{ display: "flex", gap: "5pt", marginBottom: "4pt", alignItems: "flex-start" }}>
              <span style={{ fontSize: "8pt", color: "rgba(255,255,255,0.7)", marginTop: "1pt", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: "8pt", color: "rgba(255,255,255,0.9)", wordBreak: "break-all" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div style={sidebarSection}>
            <div style={sidebarSectionTitle}>Skills</div>
            {skills.slice(0, 12).map((s, i) => (
              <div key={i} style={{ marginBottom: "3pt" }}>
                <span style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.9)" }}>• {s.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div style={sidebarSection}>
            <div style={sidebarSectionTitle}>Certifications</div>
            {certifications.map((c, i) => (
              <div key={i} style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.9)", marginBottom: "3pt" }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "8pt" }}>{c.issuer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content — respects sectionOrder for summary/experience/education */}
      <div style={{ flex: 1, padding: "var(--margin-top) 22pt var(--margin-top) 18pt" }}>
        {order.map((id) => (
          <React.Fragment key={id}>{mainSections[id] ?? null}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
