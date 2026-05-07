import React from "react";
import type { Resume, Project } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function ProjectsSection({ resume, ctx, first }: Props) {
  const { projects } = resume;
  if (projects.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Projects" ctx={ctx} first={first} />
        {projects.map((p: Project) => (
          <div key={p.id} style={{ marginBottom: "5pt" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 600, color: ctx.sbText }}>{p.name}</div>
            {p.techStack.length > 0 && (
              <div style={{ fontSize: "7.5pt", color: ctx.sbMuted }}>{p.techStack.join(", ")}</div>
            )}
          </div>
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Projects" accent={ctx.accent} uppercase={ctx.uppercase} />
      {projects.map((p: Project) => (
        <div key={p.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6pt", flexWrap: "wrap" }}>
            <strong style={{ fontSize: "10.5pt", color: "#1a1a1a" }}>{p.name}</strong>
            {p.techStack.length > 0 && (
              <span style={{ fontSize: "8.5pt", color: "#777" }}>({p.techStack.join(", ")})</span>
            )}
            {p.url && (
              <span style={{ fontSize: "8pt", color: ctx.accent }}>{p.url}</span>
            )}
          </div>
          {p.description && (
            <p style={{ margin: "2pt 0 0", color: "#555", fontSize: "9pt" }}>{p.description}</p>
          )}
          {p.bullets.length > 0 && (
            <ul style={{ margin: "3pt 0 0", paddingLeft: 0, listStyle: "none" }}>
              {p.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: "5pt", marginBottom: "2pt" }}>
                  <span style={{ color: ctx.accent, flexShrink: 0, fontWeight: 600 }}>{ctx.bulletChar}</span>
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
