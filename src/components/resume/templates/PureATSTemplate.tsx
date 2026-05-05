import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";

const DEFAULT_ORDER = ["summary", "experience", "education", "skills", "certifications"];

// Zero design — plain text for max ATS compatibility
export function PureATSTemplate({ resume, dateFormat, sectionOrder }: TemplateProps) {
  const { personalInfo, summary, experiences, educations, skills, certifications } = resume;
  const name = fullName(personalInfo);

  const base: React.CSSProperties = {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "var(--size-body)",
    color: "#000",
    lineHeight: "var(--line-height)",
    padding: "var(--margin-top) var(--margin-lr)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "var(--size-section)",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#000",
    marginTop: "var(--gap-sections)",
    marginBottom: "3pt",
    borderBottom: "1px solid #000",
    paddingBottom: "1pt",
  };

  const order = sectionOrder ?? DEFAULT_ORDER;

  const sections: Record<string, React.ReactNode> = {
    summary: summary ? (
      <>
        <div style={sectionTitle}>Summary</div>
        <p style={{ margin: "0 0 0 0", whiteSpace: "pre-line" }}>{summary}</p>
      </>
    ) : null,

    experience: experiences.length > 0 ? (
      <>
        <div style={sectionTitle}>Experience</div>
        {experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ fontWeight: 700 }}>{exp.title}</div>
            <div>{exp.company}{exp.location ? ` | ${exp.location}` : ""} | {dateRange(exp.startDate, exp.endDate, exp.current, dateFormat)}</div>
            {exp.bullets.map((b, i) => (
              <div key={i} style={{ paddingLeft: "10pt", marginTop: "1.5pt" }}>- {b}</div>
            ))}
          </div>
        ))}
      </>
    ) : null,

    education: educations.length > 0 ? (
      <>
        <div style={sectionTitle}>Education</div>
        {educations.map((edu) => (
          <div key={edu.id} style={{ marginBottom: "4pt" }}>
            <span style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
            {" | "}{edu.institution}{" | "}{dateRange(edu.startDate, edu.endDate, edu.current, dateFormat)}
            {edu.gpa && <span> | GPA: {edu.gpa}</span>}
          </div>
        ))}
      </>
    ) : null,

    skills: skills.length > 0 ? (
      <>
        <div style={sectionTitle}>Skills</div>
        <p style={{ margin: 0 }}>{skills.map((s) => s.name).join(", ")}</p>
      </>
    ) : null,

    certifications: certifications.length > 0 ? (
      <>
        <div style={sectionTitle}>Certifications</div>
        {certifications.map((c, i) => (
          <div key={i}>{c.name} | {c.issuer}{c.date ? ` | ${c.date}` : ""}</div>
        ))}
      </>
    ) : null,
  };

  return (
    <div style={base}>
      {/* Header */}
      <div style={{ marginBottom: "8pt" }}>
        <div style={{ fontSize: "var(--size-h1)", fontWeight: "var(--weight-h1)" as any }}>{name}</div>
        {personalInfo.headline && <div style={{ fontSize: "10pt" }}>{personalInfo.headline}</div>}
        <div style={{ marginTop: "3pt", fontSize: "9pt" }}>
          {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl]
            .filter(Boolean).join(" | ")}
        </div>
      </div>

      {/* Body sections in dynamic order */}
      {order.map((id) => (
        <React.Fragment key={id}>{sections[id] ?? null}</React.Fragment>
      ))}
    </div>
  );
}
