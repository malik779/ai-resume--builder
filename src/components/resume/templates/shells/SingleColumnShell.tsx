import React from "react";
import type { LayoutVariant } from "../engine";

interface Props {
  header: React.ReactNode;
  main: React.ReactNode;
  variant?: LayoutVariant;
}

export function SingleColumnShell({ header, main, variant = "standard" }: Props) {
  const contentStyle: React.CSSProperties = variant === "centered"
    ? {
        maxWidth: "540pt",
        margin: "0 auto",
        padding: "0 var(--margin-lr) var(--margin-top)",
      }
    : { padding: "0 var(--margin-lr) var(--margin-top)" };

  return (
    <div style={{
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--size-body)",
      color: "#1a1a1a",
      lineHeight: "var(--line-height)",
      minHeight: "1123px",
    }}>
      {header}
      <div style={contentStyle}>
        {main}
      </div>
    </div>
  );
}
