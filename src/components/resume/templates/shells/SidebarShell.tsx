import React from "react";
import type { LayoutVariant, SidebarAlign, SidebarStyle } from "../engine";

interface Props {
  side: "left" | "right";
  /** Sidebar width as a percentage, e.g. 30 */
  widthPct: number;
  sidebarBg: string;
  dark: boolean;
  hasBanner: boolean;
  /** Layout variant for this sidebar shell */
  variant?: LayoutVariant;
  /** Sidebar vertical alignment */
  align?: SidebarAlign;
  /** Sidebar visual style */
  sidebarStyle?: SidebarStyle;
  header: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
}

export function SidebarShell({
  side, widthPct, sidebarBg, dark, hasBanner,
  variant = "full-height",
  align = "top",
  sidebarStyle = "solid",
  header, mainContent, sidebarContent,
}: Props) {
  const sidebarTopPad = hasBanner ? "16pt" : "var(--margin-top)";
  const mainTopPad    = hasBanner ? "14pt" : "0";
  const mainPadding   = `${mainTopPad} var(--margin-lr) var(--margin-top) 18pt`;

  // narrow-accent: override width and render a pure decorative strip (no content)
  const isNarrow     = variant === "narrow-accent";
  const effectiveW   = isNarrow ? 12 : widthPct;
  const textColor    = dark ? "white" : "#1a1a1a";

  // Vertical alignment style applied to the sidebar's inner content wrapper
  const alignStyle: React.CSSProperties =
    align === "center"  ? { display: "flex", flexDirection: "column", justifyContent: "center" } :
    align === "stretch" ? { display: "flex", flexDirection: "column", justifyContent: "space-between" } :
    {};

  // ── Build sidebar element based on variant + style ─────────────────────────

  let sidebarEl: React.ReactNode;

  if (isNarrow) {
    // Pure decorative accent strip — no content, just color
    sidebarEl = (
      <div style={{ width: `${effectiveW}%`, flexShrink: 0, background: sidebarBg }} />
    );

  } else if (variant === "floating") {
    // Sidebar content lives inside a floating card with rounded corners and shadow
    sidebarEl = (
      <div style={{ width: `${effectiveW}%`, flexShrink: 0, padding: "12pt 8pt", background: "transparent" }}>
        <div style={{
          background: sidebarBg,
          color: textColor,
          borderRadius: "8pt",
          padding: `14pt 12pt`,
          height: "calc(100% - 0pt)",
          boxShadow: dark
            ? "0 4px 18px rgba(0,0,0,0.40)"
            : "0 2px 14px rgba(0,0,0,0.12)",
          ...alignStyle,
        }}>
          {sidebarContent}
        </div>
      </div>
    );

  } else if (sidebarStyle === "card") {
    // Composition override: card style on any variant
    sidebarEl = (
      <div style={{ width: `${effectiveW}%`, flexShrink: 0, background: "transparent", padding: "10pt 6pt" }}>
        <div style={{
          background: sidebarBg,
          color: textColor,
          borderRadius: "6pt",
          padding: `${sidebarTopPad} 12pt 20pt`,
          boxShadow: dark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 1px 8px rgba(0,0,0,0.08)",
          ...alignStyle,
        }}>
          {sidebarContent}
        </div>
      </div>
    );

  } else if (sidebarStyle === "minimal") {
    // Transparent background — only a border line separates sidebar from main
    const borderSide = side === "left" ? "borderRight" : "borderLeft";
    sidebarEl = (
      <div style={{
        width: `${effectiveW}%`,
        flexShrink: 0,
        background: "transparent",
        color: "#1a1a1a",
        padding: `${sidebarTopPad} 14pt 24pt`,
        [borderSide]: `2px solid ${sidebarBg}`,
        ...alignStyle,
      }}>
        {sidebarContent}
      </div>
    );

  } else {
    // Default: solid full-height background
    sidebarEl = (
      <div style={{
        width: `${effectiveW}%`,
        flexShrink: 0,
        background: sidebarBg,
        color: textColor,
        padding: `${sidebarTopPad} 14pt 24pt`,
        ...alignStyle,
      }}>
        {sidebarContent}
      </div>
    );
  }

  const mainEl = (
    <div style={{ flex: 1, padding: mainPadding }}>
      {mainContent}
    </div>
  );

  // header-hybrid: full-width accent bridge strip between header and body columns
  const bridge = variant === "header-hybrid" ? (
    <div style={{ height: "5pt", background: sidebarBg }} />
  ) : null;

  return (
    <div style={{
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--size-body)",
      color: "#1a1a1a",
      lineHeight: "var(--line-height)",
      minHeight: "1123px",
    }}>
      {header}
      {bridge}
      <div style={{ display: "flex" }}>
        {side === "left" ? <>{sidebarEl}{mainEl}</> : <>{mainEl}{sidebarEl}</>}
      </div>
    </div>
  );
}
