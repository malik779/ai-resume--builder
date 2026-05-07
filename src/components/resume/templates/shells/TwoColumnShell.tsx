import React from "react";
import type { LayoutVariant } from "../engine";

interface Props {
  header: React.ReactNode;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  variant?: LayoutVariant;
  /** Accent bg for sidebar-accent variant */
  accentBg?: string;
  accentDark?: boolean;
}

const VARIANT_LEFT_PCT: Partial<Record<LayoutVariant, number>> = {
  "equal":         50,
  "main-heavy":    65,
  "sidebar-accent": 62,
};

export function TwoColumnShell({
  header, leftContent, rightContent,
  variant = "equal",
  accentBg, accentDark,
}: Props) {
  const leftPct = VARIANT_LEFT_PCT[variant] ?? 55;
  const isAccent = variant === "sidebar-accent" && !!accentBg;

  return (
    <div style={{
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--size-body)",
      color: "#1a1a1a",
      lineHeight: "var(--line-height)",
      minHeight: "1123px",
    }}>
      {header}
      <div style={{
        display: "flex",
        gap: isAccent ? 0 : "20pt",
        padding: isAccent
          ? "0 0 0 var(--margin-lr)"
          : "0 var(--margin-lr) var(--margin-top)",
      }}>
        <div style={{
          width: `${leftPct}%`,
          flexShrink: 0,
          paddingBottom: isAccent ? "var(--margin-top)" : undefined,
        }}>
          {leftContent}
        </div>
        <div style={{
          flex: 1,
          ...(isAccent ? {
            background: accentBg,
            color: accentDark ? "white" : "#1a1a1a",
            padding: "14pt 14pt 24pt",
          } : {}),
        }}>
          {rightContent}
        </div>
      </div>
    </div>
  );
}
