import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

const DEFAULT_ORDER = ["summary", "experience", "education", "skills"];

export function SpecialistTemplate({ resume, mainColor, dateFormat, skillsLayout, skillsColumns, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);

  const sectionHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8pt",
    fontSize: "var(--size-section)",
    fontFamily: "var(--font-primary)",
    fontWeight: "var(--weight-h2)" as any,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#1a1a1a",
    marginTop: "var(--gap-sections)",
    marginBottom: "var(--gap-title)",
  };

  const accent = <div style={{ width: "4pt", height: "13pt", background: mainColor, borderRadius: "1pt", flexShrink: 0 }} />;

  const order = sectionOrder ?? DEFAULT_ORDER;

  const sections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={sectionHeader}>{accent}Summary</div>
        <p style={{ margin: 0, color: "#333" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={sectionHeader}>{accent}Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <strong style={{ fontSize: "10.5pt", color: "#1a1a1a" }}>{exp.title}</strong>
                <span style={{ margin: "0 5pt", color: "#bbb" }}>·</span>
                <span style={{ color: mainColor, fontWeight: 600 }}>{exp.company}</span>
                {exp.location && <span style={{ color: "#888", marginLeft: "5pt", fontSize: "8.5pt" }}>{exp.location}</span>}
              </div>
              <span style={{
                color: "white",
                background: mainColor,
                fontSize: "7.5pt",
                padding: "1pt 6pt",
                borderRadius: "2pt",
                whiteSpace: "nowrap",
                marginLeft: "8pt",
              }}>
                {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}
              </span>
            </div>
            {exp.bullets.length > 0 && (
              <div style={{ marginTop: "3pt" }}>
                {exp.bullets.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: "5pt", marginBottom: "2pt" }}>
                    <span style={{ color: mainColor, fontWeight: 700, flexShrink: 0, marginTop: "1pt" }}>›</span>
                    <span style={{ color: "#333" }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </>
    ) : null,

    education: educations.length > 0 ? (
      <>
        <div style={sectionHeader}>{accent}Education</div>
        {educations.map((edu) => (
          <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--gap-inside)" }}>
            <div>
              <strong style={{ color: "#1a1a1a" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</strong>
              <span style={{ color: mainColor, marginLeft: "6pt", fontWeight: 600 }}>{edu.institution}</span>
              {edu.gpa && <span style={{ color: "#777", marginLeft: "5pt", fontSize: "8.5pt" }}>GPA {edu.gpa}</span>}
            </div>
            <span style={{ color: mainColor, fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt", fontWeight: 500 }}>
              {dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}
            </span>
          </div>
        ))}
      </>
    ) : null,

    skills: skills.length > 0 ? (
      <>
        <div style={sectionHeader}>{accent}Skills</div>
        {skillsLayout === "inline" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5pt" }}>
            {skills.map((s, i) => (
              <span key={i} style={{
                background: `${mainColor}15`,
                color: mainColor,
                padding: "2pt 8pt",
                borderRadius: "2pt",
                fontSize: "8.5pt",
                fontWeight: 600,
                border: `1px solid ${mainColor}30`,
              }}>{s.name}</span>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${skillsColumns}, 1fr)`, gap: "3pt" }}>
            {skills.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4pt" }}>
                <span style={{ color: mainColor, fontWeight: 700 }}>›</span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </>
    ) : null,

    certifications: certifications.length > 0 ? (
      <>
        <div style={sectionHeader}>{accent}Certifications</div>
        {certifications.map((c, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3pt" }}>
            <span style={{ fontWeight: 600 }}>{c.name} <span style={{ fontWeight: 400, color: "#555" }}>· {c.issuer}</span></span>
            {c.date && <span style={{ color: "#666", fontSize: "8.5pt" }}>{c.date}</span>}
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
      {/* Header */}
      <div style={{ borderLeft: `5pt solid ${mainColor}`, paddingLeft: "14pt", marginBottom: "10pt" }}>
        <h1 style={{
          fontFamily: "var(--font-primary)",
          fontSize: "var(--size-h1)",
          fontWeight: "var(--weight-h1)" as any,
          color: "#1a1a1a",
          margin: "0 0 3pt 0",
          lineHeight: 1.1,
        }}>{name}</h1>
        {personalInfo.headline && (
          <div style={{ fontSize: "var(--size-h2)", color: mainColor, fontWeight: 600, marginBottom: "5pt" }}>
            {personalInfo.headline}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 16pt", fontSize: "8.5pt", color: "#555" }}>
          {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl].filter(Boolean).map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      </div>

      {/* Body sections in dynamic order */}
      {order.map((id) => (
        <React.Fragment key={id}>{sections[id] ?? null}</React.Fragment>
      ))}
    </div>
  );
}
