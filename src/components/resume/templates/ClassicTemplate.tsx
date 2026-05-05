import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

const DEFAULT_ORDER = ["summary", "experience", "education", "skills", "certifications"];

export function ClassicTemplate({ resume, mainColor, dateFormat, headerAlignment, skillsLayout, skillsColumns, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);
  const contactParts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl].filter(Boolean);

  const sectionHeader: React.CSSProperties = {
    fontSize: "var(--size-section)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1a1a1a",
    borderBottom: `1.5px solid ${mainColor}`,
    paddingBottom: "3pt",
    marginBottom: "var(--gap-title)",
    marginTop: "var(--gap-sections)",
  };

  const order = sectionOrder ?? DEFAULT_ORDER;

  const sections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={sectionHeader}>Summary</div>
        <p style={{ margin: 0, color: "#333", lineHeight: "var(--line-height)" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={sectionHeader}>Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: "10.5pt" }}>{exp.title}</span>
                <span style={{ color: "#555", marginLeft: "6pt" }}>{exp.company}</span>
                {exp.location && <span style={{ color: "#888", marginLeft: "6pt", fontSize: "9pt" }}>· {exp.location}</span>}
              </div>
              <span style={{ color: "#666", fontSize: "9pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
                {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}
              </span>
            </div>
            {exp.bullets.length > 0 && (
              <ul style={{ margin: "4pt 0 0 0", paddingLeft: "14pt", listStyle: "disc" }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: "1.5pt", color: "#333" }}>{b}</li>
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
              <span style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
              <span style={{ color: "#555", marginLeft: "6pt" }}>{edu.institution}</span>
              {edu.gpa && <span style={{ color: "#888", fontSize: "9pt", marginLeft: "6pt" }}>GPA: {edu.gpa}</span>}
            </div>
            <span style={{ color: "#666", fontSize: "9pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
              {dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}
            </span>
          </div>
        ))}
      </>
    ) : null,

    skills: skills.length > 0 ? (
      <>
        <div style={sectionHeader}>Skills</div>
        {skillsLayout === "inline" ? (
          <div style={{ color: "#333" }}>
            {skills.map((s, i) => (
              <span key={i}>{s.name}{i < skills.length - 1 ? <span style={{ color: mainColor, margin: "0 5pt" }}>·</span> : ""}</span>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${skillsColumns}, 1fr)`, gap: "2pt" }}>
            {skills.map((s, i) => <span key={i} style={{ color: "#333" }}>• {s.name}</span>)}
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
      {/* Header — always first */}
      <div style={{ textAlign: headerAlignment, marginBottom: "12pt" }}>
        <h1 style={{
          fontFamily: "var(--font-primary)",
          fontSize: "var(--size-h1)",
          fontWeight: "var(--weight-h1)" as any,
          color: "#1a1a1a",
          margin: 0,
          lineHeight: 1.1,
        }}>{name}</h1>
        {personalInfo.headline && (
          <div style={{ fontSize: "var(--size-h2)", color: mainColor, marginTop: "3pt", fontWeight: 500 }}>
            {personalInfo.headline}
          </div>
        )}
        <div style={{ fontSize: "9pt", color: "#555", marginTop: "5pt", lineHeight: 1.4 }}>
          {contactParts.join(" · ")}
        </div>
      </div>

      {/* Body sections in dynamic order */}
      {order.map((id) => (
        <React.Fragment key={id}>{sections[id] ?? null}</React.Fragment>
      ))}
    </div>
  );
}
