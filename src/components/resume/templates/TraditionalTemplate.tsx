import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

const DEFAULT_ORDER = ["summary", "experience", "education", "skills"];

export function TraditionalTemplate({ resume, mainColor, dateFormat, skillsLayout, skillsColumns, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);
  const contactParts = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean);

  const sectionHeader: React.CSSProperties = {
    fontSize: "var(--size-section)",
    fontWeight: "var(--weight-h2)" as any,
    fontFamily: "var(--font-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: mainColor,
    borderBottom: `2px solid ${mainColor}`,
    paddingBottom: "3pt",
    marginBottom: "var(--gap-title)",
    marginTop: "var(--gap-sections)",
  };

  const order = sectionOrder ?? DEFAULT_ORDER;

  const sections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={sectionHeader}>Professional Summary</div>
        <p style={{ margin: 0, color: "#333", lineHeight: "var(--line-height)", textAlign: "justify" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={sectionHeader}>Professional Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1pt" }}>
              <div>
                <strong style={{ fontSize: "10.5pt" }}>{exp.title}</strong>
                <span style={{ marginLeft: "8pt", color: mainColor, fontStyle: "italic" }}>{exp.company}</span>
                {exp.location && <span style={{ color: "#777", marginLeft: "6pt", fontSize: "9pt" }}>{exp.location}</span>}
              </div>
              <em style={{ color: "#666", fontSize: "9pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
                {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}
              </em>
            </div>
            {exp.bullets.length > 0 && (
              <ul style={{ margin: "3pt 0 0 0", paddingLeft: "15pt" }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: "2pt", color: "#333", listStyleType: "square" }}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </>
    ) : null,

    education: educations.length > 0 ? (
      <>
        <div style={sectionHeader}>Education</div>
        {educations.map((edu) => (
          <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--gap-inside)" }}>
            <div>
              <strong>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</strong>
              <span style={{ color: mainColor, marginLeft: "6pt", fontStyle: "italic" }}>{edu.institution}</span>
              {edu.honors && <span style={{ color: "#777", marginLeft: "6pt", fontSize: "9pt" }}>· {edu.honors}</span>}
            </div>
            <em style={{ color: "#666", fontSize: "9pt", whiteSpace: "nowrap" }}>
              {dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}
            </em>
          </div>
        ))}
      </>
    ) : null,

    skills: skills.length > 0 ? (
      <>
        <div style={sectionHeader}>Skills & Competencies</div>
        {skillsLayout === "inline" ? (
          <p style={{ margin: 0, color: "#333" }}>
            {skills.map((s) => s.name).join(" · ")}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${skillsColumns}, 1fr)`, gap: "2pt" }}>
            {skills.map((s, i) => <span key={i}>▸ {s.name}</span>)}
          </div>
        )}
      </>
    ) : null,

    certifications: certifications.length > 0 ? (
      <>
        <div style={sectionHeader}>Certifications</div>
        {certifications.map((c, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3pt" }}>
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <span style={{ color: "#666", fontSize: "9pt" }}>{c.issuer}{c.date ? ` · ${c.date}` : ""}</span>
          </div>
        ))}
      </>
    ) : null,
  };

  return (
    <div style={{
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--size-body)",
      color: "#1a1a1a",
      lineHeight: "var(--line-height)",
      padding: "var(--margin-top) var(--margin-lr)",
    }}>
      {/* Centered Header */}
      <div style={{ textAlign: "center", borderBottom: `3px double ${mainColor}`, paddingBottom: "14pt", marginBottom: "0" }}>
        <h1 style={{
          fontFamily: "var(--font-primary)",
          fontSize: "var(--size-h1)",
          fontWeight: "var(--weight-h1)" as any,
          color: "#1a1a1a",
          margin: "0 0 4pt 0",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>{name}</h1>
        {personalInfo.headline && (
          <div style={{ fontSize: "var(--size-h2)", color: mainColor, marginBottom: "6pt", fontStyle: "italic" }}>
            {personalInfo.headline}
          </div>
        )}
        <div style={{ fontSize: "9pt", color: "#555", lineHeight: 1.6 }}>
          {contactParts.join("  ·  ")}
        </div>
        {(personalInfo.linkedinUrl || personalInfo.githubUrl) && (
          <div style={{ fontSize: "8.5pt", color: "#777", marginTop: "2pt" }}>
            {[personalInfo.linkedinUrl, personalInfo.githubUrl].filter(Boolean).join("  ·  ")}
          </div>
        )}
      </div>

      {/* Body sections in dynamic order */}
      {order.map((id) => (
        <React.Fragment key={id}>{sections[id] ?? null}</React.Fragment>
      ))}
    </div>
  );
}
