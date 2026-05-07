import React from "react";
import type { Resume, Certification } from "@/types/resume";
import type { RenderCtx } from "./types";
import { SectionTitle } from "./SectionTitle";
import { SidebarLabel } from "./SidebarLabel";

interface Props { resume: Resume; ctx: RenderCtx; first?: boolean }

export function CertificationsSection({ resume, ctx, first }: Props) {
  const { certifications } = resume;
  if (certifications.length === 0) return null;

  if (ctx.variant === "sidebar") {
    return (
      <React.Fragment>
        <SidebarLabel label="Certifications" ctx={ctx} first={first} />
        {certifications.map((c: Certification, i: number) => (
          <div key={i} style={{ marginBottom: "4pt" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 600, color: ctx.sbText }}>{c.name}</div>
            <div style={{ fontSize: "7.5pt", color: ctx.sbMuted }}>{c.issuer}</div>
          </div>
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <SectionTitle style={ctx.sectionStyle} label="Certifications" accent={ctx.accent} uppercase={ctx.uppercase} />
      {certifications.map((c: Certification, i: number) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3pt" }}>
          <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
            {c.name}
            <span style={{ fontWeight: 400, color: "#555", marginLeft: "4pt" }}>· {c.issuer}</span>
          </span>
          {c.date && <span style={{ color: "#666", fontSize: "8.5pt" }}>{c.date}</span>}
        </div>
      ))}
    </React.Fragment>
  );
}
