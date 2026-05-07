import React from "react";
import type {
  EngineConfig, LayoutShell, SidebarBgMode,
  LayoutVariant, SidebarAlign, SidebarStyle,
} from "./engine";
import type { TemplateProps } from "./types";
import type { RenderCtx } from "./sections/types";
import {
  SECTION_RENDERERS,
  DEFAULT_SINGLE_REGIONS,
  DEFAULT_MAIN_REGIONS,
  DEFAULT_SIDEBAR_REGIONS,
} from "./sections";
import { SingleColumnShell } from "./shells/SingleColumnShell";
import { SidebarShell }      from "./shells/SidebarShell";
import { TwoColumnShell }    from "./shells/TwoColumnShell";
import { fullName } from "./helpers";

// ── Photo placeholder ─────────────────────────────────────────────────────────

function PhotoCircle({ url, size = 60, border }: { url?: string; size?: number; border?: string }) {
  return (
    <div style={{
      width: `${size}pt`,
      height: `${size}pt`,
      borderRadius: "50%",
      overflow: "hidden",
      flexShrink: 0,
      border: border ?? "2.5pt solid rgba(255,255,255,0.25)",
      background: "#b8c4d0",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    }}>
      {url ? (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        // Person silhouette SVG placeholder
        <svg viewBox="0 0 40 48" style={{ width: "78%", fill: "white", opacity: 0.55 }}>
          <ellipse cx="20" cy="15" rx="10" ry="11" />
          <path d="M0,48 Q0,27 20,27 Q40,27 40,48 Z" />
        </svg>
      )}
    </div>
  );
}

// ── Sidebar palette ───────────────────────────────────────────────────────────

interface SidebarPalette {
  bg: string;
  dark: boolean;
  sbText: string;
  sbMuted: string;
  sbLabel: string;
  sbDivider: string;
}

function resolveSidebarPalette(mode: SidebarBgMode, accent: string): SidebarPalette {
  const map: Record<SidebarBgMode, { bg: string; dark: boolean }> = {
    "dark-navy":     { bg: "#1E2A4A",     dark: true  },
    "dark-charcoal": { bg: "#222222",     dark: true  },
    "dark-accent":   { bg: accent,        dark: true  },
    "light-gray":    { bg: "#f3f4f6",     dark: false },
    "light-warm":    { bg: "#fdf8f3",     dark: false },
    "light-accent":  { bg: `${accent}13`, dark: false },
  };
  const { bg, dark } = map[mode] ?? map["dark-navy"];
  return {
    bg, dark,
    sbText:    dark ? "rgba(255,255,255,0.88)" : "#333",
    sbMuted:   dark ? "rgba(255,255,255,0.52)" : "#777",
    sbLabel:   dark ? "rgba(255,255,255,0.42)" : "#888",
    sbDivider: dark ? "rgba(255,255,255,0.12)" : "#e5e7eb",
  };
}

// ── Config resolution ─────────────────────────────────────────────────────────

function resolveShell(config: EngineConfig): LayoutShell {
  if (config.shell) return config.shell;
  if (!config.layout || config.layout === "single") return "single";
  const sc = config.layout as { side: "left" | "right" };
  return sc.side === "left" ? "sidebar-left" : "sidebar-right";
}

function resolveRegions(
  config: EngineConfig,
  shell: LayoutShell,
  sectionOrder?: string[],
): { main: string[]; sidebar: string[] } {
  if (config.regions) {
    return { main: config.regions.main, sidebar: config.regions.sidebar ?? [] };
  }
  if (shell === "single" || shell === "two-column") {
    return { main: sectionOrder ?? DEFAULT_SINGLE_REGIONS, sidebar: [] };
  }
  const main = (sectionOrder ?? DEFAULT_MAIN_REGIONS).filter(
    (k) => DEFAULT_MAIN_REGIONS.includes(k),
  );
  return { main, sidebar: DEFAULT_SIDEBAR_REGIONS };
}

function resolveSidebarDimensions(config: EngineConfig): { width: number; bg: SidebarBgMode } {
  if (config.sidebar) return { width: config.sidebar.width, bg: config.sidebar.bg };
  if (config.layout && config.layout !== "single") {
    const sc = config.layout as { width: string; bg: SidebarBgMode };
    return { width: parseInt(sc.width) || 30, bg: sc.bg };
  }
  return { width: 30, bg: "dark-navy" };
}

// ── Header ────────────────────────────────────────────────────────────────────

function RendererHeader({ config, resume, accent, isSidebarShell }: {
  config: EngineConfig;
  resume: TemplateProps["resume"];
  accent: string;
  isSidebarShell: boolean;
}) {
  const { personalInfo } = resume;
  const name = fullName(personalInfo);
  const contacts = [
    personalInfo.email, personalInfo.phone, personalInfo.location,
    personalInfo.linkedinUrl, personalInfo.githubUrl,
  ].filter(Boolean);

  const comp = config.composition ?? {};
  const nc   = config.nameColor === "accent" ? accent : "#1a1a1a";
  const hc   = config.headlineColor === "muted" ? "#777" : accent;

  const isBanner = ["banner-dark", "banner-accent", "two-tone"].includes(config.header);
  // Show contact in header for: single/two-col, banner types, or full-width headerPosition
  const showContact = !isSidebarShell || isBanner || comp.headerPosition === "full-width";

  // full-width composition: add a subtle bg to non-banner headers
  const isFullWidthComp = comp.headerPosition === "full-width" && !isBanner;
  const outerBg = isFullWidthComp ? "#f8f9fb" : "transparent";

  const h1: React.CSSProperties = {
    fontFamily: "var(--font-primary)",
    fontSize: "var(--size-h1)",
    fontWeight: "var(--weight-h1)" as React.CSSProperties["fontWeight"],
    margin: "0 0 3pt 0",
    lineHeight: 1.1,
    color: nc,
  };

  const padH = "var(--margin-top)";
  const padLR = isFullWidthComp ? "var(--margin-lr)" : "var(--margin-lr)";
  const marginBottom = "14pt";
  const showPhoto = config.showPhoto && (personalInfo.photoUrl !== undefined);

  switch (config.header) {
    case "banner-dark":
      return (
        <div style={{ background: "#1a1a1a", padding: `28pt ${padLR} 22pt`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ ...h1, color: "white" }}>{name}</h1>
            {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: accent, fontWeight: 500, marginBottom: showContact ? "6pt" : 0 }}>{personalInfo.headline}</div>}
            {showContact && <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>}
          </div>
          {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={68} border={accent} />}
        </div>
      );

    case "banner-accent":
      return (
        <div style={{ background: accent, padding: `28pt ${padLR} 22pt`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ ...h1, color: "white" }}>{name}</h1>
            {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: "rgba(255,255,255,0.82)", fontWeight: 500, marginBottom: showContact ? "6pt" : 0 }}>{personalInfo.headline}</div>}
            {showContact && <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>}
          </div>
          {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={68} border="rgba(255,255,255,0.45)" />}
        </div>
      );

    case "two-tone":
      return (
        <>
          <div style={{ background: "#1a1a1a", padding: `20pt ${padLR} 15pt`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ ...h1, color: "white" }}>{name}</h1>
              {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: accent, fontWeight: 500 }}>{personalInfo.headline}</div>}
            </div>
            {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={60} border={`${accent}60`} />}
          </div>
          {showContact && (
            <div style={{ background: accent, padding: `7pt ${padLR}` }}>
              <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.88)" }}>{contacts.join("  ·  ")}</div>
            </div>
          )}
        </>
      );

    case "split":
      return (
        <div style={{ background: outerBg, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: `${padH} ${padLR} 0`, marginBottom }}>
          <div>
            <h1 style={h1}>{name}</h1>
            {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500 }}>{personalInfo.headline}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6pt" }}>
            {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={62} border={`${accent}55`} />}
            {showContact && (
              <div style={{ textAlign: "right", fontSize: "8.5pt", color: "#555", lineHeight: 1.8 }}>
                {contacts.map((c, i) => <div key={i}>{c}</div>)}
              </div>
            )}
          </div>
        </div>
      );

    case "stack-center":
      return (
        <div style={{ background: outerBg, padding: `${padH} ${padLR} 0`, marginBottom, textAlign: "center" }}>
          {showPhoto && <div style={{ display: "flex", justifyContent: "center", marginBottom: "8pt" }}><PhotoCircle url={personalInfo.photoUrl} size={64} border={`${accent}50`} /></div>}
          <h1 style={h1}>{name}</h1>
          {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: showContact ? "5pt" : 0 }}>{personalInfo.headline}</div>}
          {showContact && <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>}
        </div>
      );

    case "line-accent":
      return (
        <div style={{ background: outerBg, padding: `${padH} ${padLR} 0`, marginBottom }}>
          <div style={{ width: "36pt", height: "3pt", background: accent, borderRadius: "2pt", marginBottom: "8pt" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={h1}>{name}</h1>
              {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: showContact ? "5pt" : 0 }}>{personalInfo.headline}</div>}
              {showContact && <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>}
            </div>
            {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={62} border={`${accent}50`} />}
          </div>
        </div>
      );

    case "underbar":
      return (
        <div style={{ background: outerBg, padding: `${padH} ${padLR} 0`, marginBottom: "8pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h1 style={h1}>{name}</h1>
              {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: "4pt" }}>{personalInfo.headline}</div>}
            </div>
            {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={60} border={`${accent}50`} />}
          </div>
          <div style={{ height: "3pt", background: `linear-gradient(to right, ${accent}, ${accent}20)`, borderRadius: "2pt", margin: "6pt 0 8pt" }} />
          {showContact && <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 14pt" }}>{contacts.map((c, i) => <span key={i}>{c}</span>)}</div>}
        </div>
      );

    // stack-left (default)
    default:
      return (
        <div style={{ background: outerBg, padding: `${padH} ${padLR} 0`, marginBottom }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h1 style={h1}>{name}</h1>
              {personalInfo.headline && <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: showContact ? "5pt" : 0 }}>{personalInfo.headline}</div>}
              {showContact && <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>}
            </div>
            {showPhoto && <PhotoCircle url={personalInfo.photoUrl} size={64} border={`${accent}50`} />}
          </div>
        </div>
      );
  }
}

// ── Core renderer ─────────────────────────────────────────────────────────────

function EngineRendererInner({
  resume, config, mainColor, dateFormat, skillsLayout, skillsColumns, sectionOrder,
}: TemplateProps & { config: EngineConfig }) {
  const comp   = config.composition ?? {};
  const shell  = resolveShell(config);
  const regions = resolveRegions(config, shell, sectionOrder);

  const isBanner      = ["banner-dark", "banner-accent", "two-tone"].includes(config.header);
  const isSidebarShell = shell === "sidebar-left" || shell === "sidebar-right";

  const { width: sbWidth, bg: sbBgMode } = resolveSidebarDimensions(config);
  const { bg: sbBg, dark: sbDark, sbText, sbMuted, sbLabel, sbDivider } =
    resolveSidebarPalette(sbBgMode, mainColor);

  const mainCtx: RenderCtx = {
    accent: mainColor,
    sectionStyle: config.section,
    dateFormat,
    uppercase: config.uppercase !== false,
    bulletChar: config.bulletChar ?? "›",
    variant: "main",
    sbText: "", sbMuted: "", sbLabel: "", sbDivider: "",
    skillsLayout,
    skillsColumns,
  };

  const sidebarCtx: RenderCtx = {
    ...mainCtx,
    variant: "sidebar",
    sbText, sbMuted, sbLabel, sbDivider,
  };

  const header = (
    <RendererHeader
      config={config}
      resume={resume}
      accent={mainColor}
      isSidebarShell={isSidebarShell}
    />
  );

  const renderRegion = (keys: string[], ctx: RenderCtx) =>
    keys.map((key) => SECTION_RENDERERS[key]?.(resume, ctx, key) ?? null);

  const mainNodes    = renderRegion(regions.main,    mainCtx);
  const sidebarNodes = renderRegion(regions.sidebar, sidebarCtx);

  if (isSidebarShell) {
    return (
      <SidebarShell
        side={shell === "sidebar-left" ? "left" : "right"}
        widthPct={sbWidth}
        sidebarBg={sbBg}
        dark={sbDark}
        hasBanner={isBanner}
        variant={comp.layoutVariant as LayoutVariant | undefined}
        align={comp.sidebarAlign as SidebarAlign | undefined}
        sidebarStyle={comp.sidebarStyle as SidebarStyle | undefined}
        header={header}
        mainContent={mainNodes}
        sidebarContent={sidebarNodes}
      />
    );
  }

  if (shell === "two-column") {
    return (
      <TwoColumnShell
        header={header}
        leftContent={mainNodes}
        rightContent={sidebarNodes}
        variant={comp.layoutVariant as LayoutVariant | undefined}
        accentBg={sbBg}
        accentDark={sbDark}
      />
    );
  }

  return (
    <SingleColumnShell
      header={header}
      main={mainNodes}
      variant={comp.layoutVariant as LayoutVariant | undefined}
    />
  );
}

/**
 * Factory that wraps EngineRendererInner so it matches the TemplateProps interface
 * and can be stored in TEMPLATE_REGISTRY or returned from resolveTemplateComponent.
 */
export function createEngineRenderer(config: EngineConfig): React.FC<TemplateProps> {
  const Component: React.FC<TemplateProps> = (props) => (
    <EngineRendererInner {...props} config={config} />
  );
  Component.displayName = "EngineRenderer";
  return Component;
}
