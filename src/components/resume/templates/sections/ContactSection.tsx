import React from "react";
import type { Resume } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function ContactSection({ resume, ctx, first }: Props) {
  const { personalInfo } = resume;
  const contacts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedinUrl,
    personalInfo.githubUrl,
    personalInfo.portfolioUrl,
  ].filter(Boolean);

  if (contacts.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Contact" ctx={ctx} first={first} />
        {contacts.map((c, i) => (
          <div key={i} style={{ fontSize: "8pt", color: ctx.sbText, marginBottom: "3pt", wordBreak: "break-all" }}>{c}</div>
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Contact" accent={ctx.accent} uppercase={ctx.uppercase} />
      <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>
        {contacts.join("  ·  ")}
      </div>
    </React.Fragment>
  );
}
