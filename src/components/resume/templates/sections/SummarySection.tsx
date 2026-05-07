import React from "react";
import type { Resume } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function SummarySection({ resume, ctx, first }: Props) {
  if (!resume.summary) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Summary" ctx={ctx} first={first} />
        <p style={{ fontSize: "8pt", color: ctx.sbText, lineHeight: 1.5, margin: 0 }}>{resume.summary}</p>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Summary" accent={ctx.accent} uppercase={ctx.uppercase} />
      <p style={{ margin: 0, color: "#333", lineHeight: "var(--line-height)" }}>{resume.summary}</p>
    </React.Fragment>
  );
}
