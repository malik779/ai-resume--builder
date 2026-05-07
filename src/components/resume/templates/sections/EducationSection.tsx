import React from "react";
import type { Resume, Education } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";
import { dateRange } from "../helpers";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function EducationSection({ resume, ctx, first }: Props) {
  const { educations } = resume;
  if (educations.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Education" ctx={ctx} first={first} />
        {educations.map((e: Education) => (
          <div key={e.id} style={{ marginBottom: "6pt" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 600, color: ctx.sbText }}>
              {e.degree}{e.field ? ` in ${e.field}` : ""}
            </div>
            <div style={{ fontSize: "7.5pt", color: ctx.sbMuted }}>{e.institution}</div>
            <div style={{ fontSize: "7pt", color: ctx.sbMuted }}>
              {dateRange(e.startDate, e.endDate, e.current, ctx.dateFormat)}
            </div>
          </div>
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Education" accent={ctx.accent} uppercase={ctx.uppercase} />
      {educations.map((e: Education) => (
        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--gap-inside)" }}>
          <div>
            <strong style={{ color: "#1a1a1a" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</strong>
            <span style={{ color: ctx.accent, marginLeft: "6pt" }}>{e.institution}</span>
            {e.gpa && <span style={{ color: "#777", fontSize: "8.5pt", marginLeft: "5pt" }}>· GPA {e.gpa}</span>}
            {e.honors && <div style={{ fontSize: "8.5pt", color: "#666", marginTop: "1pt" }}>{e.honors}</div>}
          </div>
          <span style={{ color: "#666", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
            {dateRange(e.startDate, e.endDate, e.current, ctx.dateFormat)}
          </span>
        </div>
      ))}
    </React.Fragment>
  );
}
