import React from "react";
import type { Resume, Language } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function LanguagesSection({ resume, ctx, first }: Props) {
  const { languages } = resume;
  if (languages.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Languages" ctx={ctx} first={first} />
        {languages.map((l: Language, i: number) => (
          <div key={i} style={{ fontSize: "8.5pt", color: ctx.sbText, marginBottom: "2pt" }}>
            {l.name} <span style={{ color: ctx.sbMuted }}>· {l.proficiency}</span>
          </div>
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Languages" accent={ctx.accent} uppercase={ctx.uppercase} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6pt 20pt" }}>
        {languages.map((l: Language, i: number) => (
          <span key={i} style={{ color: "#333" }}>
            {l.name}
            {l.proficiency && <span style={{ color: "#777", marginLeft: "4pt" }}>· {l.proficiency}</span>}
          </span>
        ))}
      </div>
    </React.Fragment>
  );
}
