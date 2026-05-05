import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

const DEFAULT_ORDER = ["summary", "experience", "education", "skills", "certifications"];

export function PrimeATSTemplate({ resume, mainColor, dateFormat, skillsLayout, skillsColumns, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);

  const sectionHeader: React.CSSProperties = {
    fontSize: "var(--size-section)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: mainColor,
    borderBottom: `2px solid ${mainColor}`,
    paddingBottom: "2pt",
    marginBottom: "var(--gap-title)",
    marginTop: "var(--gap-sections)",
  };

  const order = sectionOrder ?? DEFAULT_ORDER;

  const sections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={sectionHeader}>Summary</div>
        <p style={{ margin: 0, color: "#333" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={sectionHeader}>Professional Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <strong style={{ fontSize: "10.5pt" }}>{exp.title}</strong>
                <span style={{ marginLeft: "5pt", color: mainColor }}>, {exp.company}</span>
                {exp.location && <span style={{ color: "#777", fontSize: "9pt", marginLeft: "5pt" }}>· {exp.location}</span>}
              </div>
              <span style={{ color: "#666", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
                {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}
              </span>
            </div>
            {exp.bullets.length > 0 && (
              <ul style={{ margin: "3pt 0 0 0", paddingLeft: "14pt" }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: "2pt", color: "#333" }}>{b}</li>
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
          <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5pt" }}>
            <div>
              <strong>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</strong>
              <span style={{ color: mainColor, marginLeft: "6pt" }}>{edu.institution}</span>
              {edu.honors && <div style={{ fontSize: "8.5pt", color: "#666", marginTop: "1pt" }}>{edu.honors}</div>}
            </div>
            <span style={{ color: "#666", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
              {dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}
            </span>
          </div>
        ))}
      </>
    ) : null,

    skills: skills.length > 0 ? (
      <>
        <div style={sectionHeader}>Technical Skills</div>
        {skillsLayout === "inline" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5pt" }}>
            {skills.map((s, i) => (
              <span key={i} style={{
                background: `${mainColor}12`,
                border: `1px solid ${mainColor}40`,
                color: mainColor,
                padding: "1pt 7pt",
                borderRadius: "3pt",
                fontSize: "8.5pt",
                fontWeight: 500,
              }}>{s.name}</span>
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
      {/* Two-column header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12pt", gap: "16pt" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "var(--font-primary)",
            fontSize: "var(--size-h1)",
            fontWeight: "var(--weight-h1)" as any,
            color: mainColor,
            margin: "0 0 2pt 0",
            lineHeight: 1.1,
          }}>{name}</h1>
          {personalInfo.headline && (
            <div style={{ fontSize: "var(--size-h2)", color: "#333", marginBottom: "6pt", fontWeight: 500 }}>
              {personalInfo.headline}
            </div>
          )}
          <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.7 }}>
            {[personalInfo.location, personalInfo.email, personalInfo.phone].filter(Boolean).map((v, i) => (
              <span key={i}>{v}{i < 2 ? <span style={{ margin: "0 6pt", color: mainColor }}>|</span> : ""}</span>
            ))}
          </div>
          {personalInfo.linkedinUrl && (
            <div style={{ fontSize: "8pt", color: "#777", marginTop: "2pt" }}>{personalInfo.linkedinUrl}</div>
          )}
        </div>
        {/* Photo */}
        <div style={{
          width: "64pt", height: "64pt",
          borderRadius: "50%",
          border: `2px solid ${mainColor}`,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          background: `${mainColor}20`,
        }}>
          {personalInfo.photoUrl ? (
            <img src={personalInfo.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "22pt", fontWeight: 700, color: mainColor }}>
              {personalInfo.firstName?.[0] ?? "?"}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "2pt", background: `linear-gradient(to right, ${mainColor}, ${mainColor}40)`, borderRadius: "1pt", marginBottom: "0" }} />

      {/* Body sections in dynamic order */}
      {order.map((id) => (
        <React.Fragment key={id}>{sections[id] ?? null}</React.Fragment>
      ))}
    </div>
  );
}
