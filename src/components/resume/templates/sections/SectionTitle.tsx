import React from "react";
import type { SectionStyle } from "../engine";

interface Props {
  style: SectionStyle;
  label: string;
  accent: string;
  uppercase: boolean;
}

export function SectionTitle({ style, label, accent, uppercase }: Props) {
  const t = uppercase ? label.toUpperCase() : label;
  const base: React.CSSProperties = { marginTop: "var(--gap-sections)", marginBottom: "var(--gap-title)" };

  switch (style) {
    case "underline":
      return (
        <div style={{ ...base, fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", color: "#1a1a1a", borderBottom: `1.5px solid ${accent}`, paddingBottom: "3pt" }}>
          {t}
        </div>
      );

    case "overline":
      return (
        <div style={base}>
          <div style={{ height: "2.5pt", background: accent, borderRadius: "1pt", marginBottom: "4pt" }} />
          <div style={{ fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", color: accent }}>{t}</div>
        </div>
      );

    case "left-bar":
      return (
        <div style={{ ...base, display: "flex", alignItems: "center", gap: "8pt" }}>
          <div style={{ width: "3pt", height: "14pt", background: accent, borderRadius: "1.5pt", flexShrink: 0 }} />
          <span style={{ fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", color: "#1a1a1a" }}>{t}</span>
        </div>
      );

    case "filled":
      return (
        <div style={base}>
          <span style={{ display: "inline-block", background: accent, color: "white", fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", padding: "2.5pt 10pt", borderRadius: "2pt" }}>
            {t}
          </span>
        </div>
      );

    case "caps":
      return (
        <div style={{ ...base, fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.12em", color: accent }}>
          {t}
        </div>
      );

    case "flanked":
      return (
        <div style={{ ...base, display: "flex", alignItems: "center", gap: "8pt" }}>
          <div style={{ flex: 1, height: "1px", background: accent, opacity: 0.35 }} />
          <span style={{ fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.1em", color: accent, whiteSpace: "nowrap" }}>{t}</span>
          <div style={{ flex: 1, height: "1px", background: accent, opacity: 0.35 }} />
        </div>
      );

    case "badge":
      return (
        <div style={base}>
          <span style={{ display: "inline-flex", alignItems: "center", background: `${accent}14`, color: accent, border: `1px solid ${accent}30`, borderRadius: "20pt", fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.06em", padding: "2pt 10pt" }}>
            {t}
          </span>
        </div>
      );

    case "side-dot":
      return (
        <div style={{ ...base, display: "flex", alignItems: "center", gap: "6pt" }}>
          <div style={{ width: "7pt", height: "7pt", borderRadius: "50%", background: accent, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", color: "#1a1a1a" }}>{t}</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>
      );
  }
}
