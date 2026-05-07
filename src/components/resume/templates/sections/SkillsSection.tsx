import React from "react";
import type { Resume, Skill } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function SkillsSection({ resume, ctx, first }: Props) {
  const { skills } = resume;
  if (skills.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Skills" ctx={ctx} first={first} />
        {skills.map((s: Skill, i: number) => (
          <div key={i} style={{ fontSize: "8.5pt", color: ctx.sbText, marginBottom: "2.5pt" }}>· {s.name}</div>
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Skills" accent={ctx.accent} uppercase={ctx.uppercase} />
      {ctx.skillsLayout === "inline" ? (
        <div style={{ color: "#333", lineHeight: "var(--line-height)" }}>
          {skills.map((s: Skill, i: number) => (
            <span key={i}>
              {s.name}
              {i < skills.length - 1 && <span style={{ color: ctx.accent, margin: "0 5pt" }}>·</span>}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${ctx.skillsColumns}, 1fr)`, gap: "2pt" }}>
          {skills.map((s: Skill, i: number) => (
            <span key={i} style={{ color: "#333" }}>• {s.name}</span>
          ))}
        </div>
      )}
    </React.Fragment>
  );
}
