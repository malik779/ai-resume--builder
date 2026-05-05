import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

// Clean has left sidebar (contact, skills, education, certifications) and right column (summary, experience)
const RIGHT_SECTIONS = ["summary", "experience"];
const DEFAULT_ORDER = ["summary", "experience"];

// Two-column body: INFO/SKILLS left, PROFILE/EXPERIENCE right
export function CleanTemplate({ resume, mainColor, dateFormat, skillsLayout, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);

  const leftSectionTitle: React.CSSProperties = {
    fontSize: "8pt",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: mainColor,
    marginTop: "16pt",
    marginBottom: "5pt",
    borderBottom: `1px solid ${mainColor}`,
    paddingBottom: "2pt",
  };

  const rightSectionTitle: React.CSSProperties = {
    fontSize: "var(--size-section)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#1a1a1a",
    borderBottom: `1.5px solid #e5e7eb`,
    paddingBottom: "2pt",
    marginTop: "var(--gap-sections)",
    marginBottom: "var(--gap-title)",
  };

  // Only right-column sections are reorderable
  const order = (sectionOrder ?? DEFAULT_ORDER).filter((id) => RIGHT_SECTIONS.includes(id));

  const rightSections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={rightSectionTitle}>Profile</div>
        <p style={{ margin: 0, color: "#333", textAlign: "justify" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={rightSectionTitle}>Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <strong style={{ fontSize: "10pt" }}>{exp.title}</strong>
                <span style={{ color: mainColor, marginLeft: "5pt", fontWeight: 600 }}>{exp.company}</span>
              </div>
              <span style={{ color: "#888", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
                {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}
              </span>
            </div>
            {exp.location && <div style={{ fontSize: "8.5pt", color: "#777", marginTop: "1pt" }}>{exp.location}</div>}
            {exp.bullets.length > 0 && (
              <ul style={{ margin: "3pt 0 0 0", paddingLeft: "13pt" }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: "1.5pt", color: "#333" }}>{b}</li>
                ))}
              </ul>
            )}
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
    }}>
      {/* Full-width header */}
      <div style={{
        padding: "22pt var(--margin-lr) 18pt",
        background: "#1a1a1a",
        color: "white",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-primary)",
              fontSize: "var(--size-h1)",
              fontWeight: "var(--weight-h1)" as any,
              margin: "0 0 3pt 0",
              lineHeight: 1.1,
              color: "white",
            }}>{name}</h1>
            {personalInfo.headline && (
              <div style={{ fontSize: "var(--size-h2)", color: mainColor, fontWeight: 500 }}>
                {personalInfo.headline}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", fontSize: "8pt", color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
            {[personalInfo.email, personalInfo.phone].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Left column — fixed layout */}
        <div style={{
          width: "32%",
          borderRight: `2px solid #f3f4f6`,
          padding: `8pt 16pt var(--margin-top) var(--margin-lr)`,
          background: "#fafafa",
        }}>
          {/* Contact */}
          <div style={{ ...leftSectionTitle, marginTop: "8pt" }}>Contact</div>
          {[
            personalInfo.location && { label: "Location", val: personalInfo.location },
            personalInfo.linkedinUrl && { label: "LinkedIn", val: personalInfo.linkedinUrl },
            personalInfo.githubUrl && { label: "GitHub", val: personalInfo.githubUrl },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} style={{ marginBottom: "4pt" }}>
              <div style={{ fontSize: "7.5pt", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
              <div style={{ fontSize: "8.5pt", wordBreak: "break-all", color: "#333" }}>{item.val}</div>
            </div>
          ))}

          {/* Skills */}
          {skills.length > 0 && (
            <>
              <div style={leftSectionTitle}>Skills</div>
              {skills.slice(0, 14).map((s, i) => (
                <div key={i} style={{ fontSize: "8.5pt", color: "#333", marginBottom: "3pt", display: "flex", alignItems: "center", gap: "4pt" }}>
                  <span style={{ width: "4pt", height: "4pt", borderRadius: "50%", background: mainColor, display: "inline-block", flexShrink: 0 }} />
                  {s.name}
                </div>
              ))}
            </>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <>
              <div style={leftSectionTitle}>Education</div>
              {educations.map((edu) => (
                <div key={edu.id} style={{ marginBottom: "8pt" }}>
                  <div style={{ fontWeight: 700, fontSize: "8.5pt" }}>{edu.degree}</div>
                  {edu.field && <div style={{ fontSize: "8pt", color: "#555" }}>{edu.field}</div>}
                  <div style={{ fontSize: "8pt", color: mainColor, fontWeight: 600 }}>{edu.institution}</div>
                  <div style={{ fontSize: "7.5pt", color: "#888" }}>{dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}</div>
                  {edu.gpa && <div style={{ fontSize: "7.5pt", color: "#777" }}>GPA: {edu.gpa}</div>}
                </div>
              ))}
            </>
          )}

          {certifications.length > 0 && (
            <>
              <div style={leftSectionTitle}>Certifications</div>
              {certifications.map((c, i) => (
                <div key={i} style={{ marginBottom: "5pt" }}>
                  <div style={{ fontWeight: 600, fontSize: "8.5pt" }}>{c.name}</div>
                  <div style={{ fontSize: "8pt", color: "#666" }}>{c.issuer}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right column — respects sectionOrder for summary and experience */}
        <div style={{ flex: 1, padding: `8pt 20pt var(--margin-top) 16pt` }}>
          {order.map((id) => (
            <React.Fragment key={id}>{rightSections[id] ?? null}</React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
