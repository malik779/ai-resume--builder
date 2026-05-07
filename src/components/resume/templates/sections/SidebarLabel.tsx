import React from "react";
import type { RenderCtx } from "./types";

interface Props {
  label: string;
  ctx: RenderCtx;
  first?: boolean;
}

// Compact uppercase section label used inside sidebar columns.
// Always uses the same minimal style regardless of the configured SectionStyle.
export function SidebarLabel({ label, ctx, first = false }: Props) {
  return (
    <div style={{
      fontSize: "7pt",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: ctx.sbLabel,
      marginTop: first ? 0 : "12pt",
      marginBottom: "6pt",
    }}>
      {label}
    </div>
  );
}
