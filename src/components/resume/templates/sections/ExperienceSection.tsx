import React from "react";
import type { Resume, WorkExperience } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";
import { dateRange } from "../helpers";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function ExperienceSection({ resume, ctx, first }: Props) {
  const { experiences } = resume;
  if (experiences.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Experience" ctx={ctx} first={first} />
        {experiences.map((e: WorkExperience) => (
          <div key={e.id} style={{ marginBottom: "6pt" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 600, color: ctx.sbText }}>{e.title}</div>
            {e.company && <div style={{ fontSize: "7.5pt", color: ctx.sbMuted }}>{e.company}</div>}
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
      <SectionTitle style={ctx.sectionStyle} label="Experience" accent={ctx.accent} uppercase={ctx.uppercase} />
      {experiences.map((e: WorkExperience) => (
        <div key={e.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <strong style={{ fontSize: "10.5pt", color: "#1a1a1a" }}>{e.title}</strong>
              {e.company && <span style={{ color: ctx.accent, marginLeft: "6pt", fontWeight: 600 }}>{e.company}</span>}
              {e.location && <span style={{ color: "#888", marginLeft: "5pt", fontSize: "8.5pt" }}>· {e.location}</span>}
            </div>
            <span style={{ color: "#666", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
              {dateRange(e.startDate, e.endDate, e.current, ctx.dateFormat)}
            </span>
          </div>
          {e.bullets.length > 0 && (
            <ul style={{ margin: "3pt 0 0", paddingLeft: 0, listStyle: "none" }}>
              {e.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: "5pt", marginBottom: "2pt" }}>
                  <span style={{ color: ctx.accent, flexShrink: 0, marginTop: "1pt", fontWeight: 600 }}>{ctx.bulletChar}</span>
                  <span style={{ color: "#333" }}>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </React.Fragment>
  );
}
