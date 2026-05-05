import React from "react";
import type { TemplateProps } from "./types";
import { fullName, dateRange } from "./helpers";
import type { WorkExperience, Education, Skill, Certification, Language } from "@/types/resume";
import type { DateFormat } from "@/stores/customize.store";

// ─── Config types ──────────────────────────────────────────────────────────────

export type HeaderStyle =
  | "stack-left"     // name + headline + contact, left-aligned
  | "stack-center"   // same, centered
  | "split"          // name left │ contact right
  | "banner-dark"    // full-width dark background
  | "banner-accent"  // full-width accent-color background
  | "two-tone"       // dark name strip + accent contact strip
  | "line-accent"    // short accent bar above name
  | "underbar";      // name + gradient underline then contact

export type SectionStyle =
  | "underline"   // text + bottom border
  | "overline"    // thick top bar then text
  | "left-bar"    // 3px vertical accent bar
  | "filled"      // accent bg chip
  | "caps"        // bold uppercase, no decoration
  | "flanked"     // ─── TITLE ───
  | "badge"       // rounded pill
  | "side-dot";   // ● TITLE ──────

export type SidebarBgMode =
  | "dark-navy"     // #1E2A4A
  | "dark-charcoal" // #222222
  | "dark-accent"   // solid mainColor
  | "light-gray"    // #f3f4f6
  | "light-warm"    // #fdf8f3
  | "light-accent"; // mainColor tinted 8%

export interface SidebarCfg {
  side: "left" | "right";
  width: string;
  bg: SidebarBgMode;
}

export interface EngineConfig {
  header: HeaderStyle;
  section: SectionStyle;
  layout: "single" | SidebarCfg;
  bulletChar?: string;
  nameColor?: "dark" | "accent";
  headlineColor?: "accent" | "muted";
  uppercase?: boolean;
  showPhoto?: boolean;    // circular photo in header (right side)
  sidebarPhoto?: boolean; // photo at top of sidebar panel
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const BODY_SECTIONS = ["summary", "experience", "education", "skills", "certifications"];
const MAIN_ONLY     = ["summary", "experience", "education"];

function sidebarPalette(mode: SidebarBgMode, accent: string) {
  switch (mode) {
    case "dark-navy":     return { bg: "#1E2A4A",        dark: true  };
    case "dark-charcoal": return { bg: "#222222",        dark: true  };
    case "dark-accent":   return { bg: accent,           dark: true  };
    case "light-gray":    return { bg: "#f3f4f6",        dark: false };
    case "light-warm":    return { bg: "#fdf8f3",        dark: false };
    default:              return { bg: `${accent}13`,    dark: false };
  }
}

// ─── Photo circle ─────────────────────────────────────────────────────────────

function PhotoCircle({ url, size = 60, border }: { url?: string; size?: number; border?: string }) {
  return (
    <div style={{
      width: `${size}pt`,
      height: `${size}pt`,
      borderRadius: "50%",
      overflow: "hidden",
      flexShrink: 0,
      border: border ?? "2.5pt solid rgba(255,255,255,0.25)",
      background: "#b0b0b0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {url
        ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: `${size * 0.38}pt`, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>?</span>
      }
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ style, label, accent, up }: {
  style: SectionStyle; label: string; accent: string; up: boolean;
}) {
  const t = up ? label.toUpperCase() : label;
  const base: React.CSSProperties = { marginTop: "var(--gap-sections)", marginBottom: "var(--gap-title)" };

  switch (style) {
    case "underline":
      return <div style={{ ...base, fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", color: "#1a1a1a", borderBottom: `1.5px solid ${accent}`, paddingBottom: "3pt" }}>{t}</div>;

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
      return <div style={{ ...base }}><span style={{ display: "inline-block", background: accent, color: "white", fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.08em", padding: "2.5pt 10pt", borderRadius: "2pt" }}>{t}</span></div>;

    case "caps":
      return <div style={{ ...base, fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.12em", color: accent }}>{t}</div>;

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
          <span style={{ display: "inline-flex", alignItems: "center", background: `${accent}14`, color: accent, border: `1px solid ${accent}30`, borderRadius: "20pt", fontSize: "var(--size-section)", fontWeight: 700, letterSpacing: "0.06em", padding: "2pt 10pt" }}>{t}</span>
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

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ style, resume, accent, nameColor = "dark", headlineColor = "accent", showContact, showPhoto = false }: {
  style: HeaderStyle;
  resume: TemplateProps["resume"];
  accent: string;
  nameColor?: "dark" | "accent";
  headlineColor?: "accent" | "muted";
  showContact: boolean;
  showPhoto?: boolean;
}) {
  const { personalInfo } = resume;
  const name = fullName(personalInfo);
  const contacts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl, personalInfo.githubUrl].filter(Boolean);
  const nc = nameColor === "accent" ? accent : "#1a1a1a";
  const hc = headlineColor === "accent" ? accent : "#777";
  const photoUrl = personalInfo.photoUrl;
  const hasPhoto = showPhoto && !!photoUrl;

  const h1: React.CSSProperties = {
    fontFamily: "var(--font-primary)",
    fontSize: "var(--size-h1)",
    fontWeight: "var(--weight-h1)" as React.CSSProperties["fontWeight"],
    margin: "0 0 3pt 0",
    lineHeight: 1.1,
    color: nc,
  };

  switch (style) {
    case "stack-left":
      return (
        <div style={{ padding: "var(--margin-top) var(--margin-lr) 0", marginBottom: "14pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h1 style={h1}>{name}</h1>
              {personalInfo.headline && (
                <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: showContact ? "5pt" : 0 }}>
                  {personalInfo.headline}
                </div>
              )}
              {showContact && (
                <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>
              )}
            </div>
            {hasPhoto && (
              <PhotoCircle url={photoUrl} size={64} border={`${accent}50`} />
            )}
          </div>
        </div>
      );

    case "stack-center":
      return (
        <div style={{ padding: "var(--margin-top) var(--margin-lr) 0", marginBottom: "14pt", textAlign: "center" }}>
          <h1 style={h1}>{name}</h1>
          {personalInfo.headline && (
            <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: showContact ? "5pt" : 0 }}>
              {personalInfo.headline}
            </div>
          )}
          {showContact && (
            <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>
          )}
        </div>
      );

    case "split":
      return (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "var(--margin-top) var(--margin-lr) 0",
          marginBottom: "14pt",
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={h1}>{name}</h1>
            {personalInfo.headline && (
              <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500 }}>{personalInfo.headline}</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8pt", paddingTop: "2pt" }}>
            {hasPhoto && <PhotoCircle url={photoUrl} size={62} border={`${accent}55`} />}
            {showContact && (
              <div style={{ textAlign: "right", fontSize: "8.5pt", color: "#555", lineHeight: 1.8 }}>
                {contacts.map((c, i) => <div key={i}>{c}</div>)}
              </div>
            )}
          </div>
        </div>
      );

    case "banner-dark":
      return (
        <div style={{
          background: "#1a1a1a",
          padding: "28pt var(--margin-lr) 22pt",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h1 style={{ ...h1, color: "white" }}>{name}</h1>
            {personalInfo.headline && (
              <div style={{ fontSize: "var(--size-h2)", color: accent, fontWeight: 500, marginBottom: showContact ? "6pt" : 0 }}>
                {personalInfo.headline}
              </div>
            )}
            {showContact && (
              <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>
                {contacts.join(" · ")}
              </div>
            )}
          </div>
          {hasPhoto && <PhotoCircle url={photoUrl} size={68} border={accent} />}
        </div>
      );

    case "banner-accent":
      return (
        <div style={{
          background: accent,
          padding: "28pt var(--margin-lr) 22pt",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h1 style={{ ...h1, color: "white" }}>{name}</h1>
            {personalInfo.headline && (
              <div style={{ fontSize: "var(--size-h2)", color: "rgba(255,255,255,0.82)", fontWeight: 500, marginBottom: showContact ? "6pt" : 0 }}>
                {personalInfo.headline}
              </div>
            )}
            {showContact && (
              <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
                {contacts.join(" · ")}
              </div>
            )}
          </div>
          {hasPhoto && <PhotoCircle url={photoUrl} size={68} border="rgba(255,255,255,0.45)" />}
        </div>
      );

    case "two-tone":
      return (
        <>
          <div style={{ background: "#1a1a1a", padding: "20pt var(--margin-lr) 15pt" }}>
            <h1 style={{ ...h1, color: "white" }}>{name}</h1>
            {personalInfo.headline && (
              <div style={{ fontSize: "var(--size-h2)", color: accent, fontWeight: 500, marginTop: "2pt" }}>
                {personalInfo.headline}
              </div>
            )}
          </div>
          {showContact && (
            <div style={{ background: accent, padding: "7pt var(--margin-lr)" }}>
              <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.88)", letterSpacing: "0.02em" }}>
                {contacts.join("  ·  ")}
              </div>
            </div>
          )}
        </>
      );

    case "line-accent":
      return (
        <div style={{ padding: "var(--margin-top) var(--margin-lr) 0", marginBottom: "14pt" }}>
          <div style={{ width: "36pt", height: "3pt", background: accent, borderRadius: "2pt", marginBottom: "8pt" }} />
          <h1 style={h1}>{name}</h1>
          {personalInfo.headline && (
            <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: showContact ? "5pt" : 0 }}>
              {personalInfo.headline}
            </div>
          )}
          {showContact && (
            <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6 }}>{contacts.join(" · ")}</div>
          )}
        </div>
      );

    case "underbar":
      return (
        <div style={{ padding: "var(--margin-top) var(--margin-lr) 0", marginBottom: "8pt" }}>
          <h1 style={h1}>{name}</h1>
          {personalInfo.headline && (
            <div style={{ fontSize: "var(--size-h2)", color: hc, fontWeight: 500, marginBottom: "4pt" }}>
              {personalInfo.headline}
            </div>
          )}
          <div style={{ height: "3pt", background: `linear-gradient(to right, ${accent}, ${accent}20)`, borderRadius: "2pt", margin: "6pt 0 8pt" }} />
          {showContact && (
            <div style={{ fontSize: "8.5pt", color: "#555", lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 14pt" }}>
              {contacts.map((c, i) => <span key={i}>{c}</span>)}
            </div>
          )}
        </div>
      );
  }
}

// ─── Body sections ────────────────────────────────────────────────────────────

function buildBody(
  resume: TemplateProps["resume"],
  cfg: EngineConfig,
  accent: string,
  dateFormat: DateFormat,
  skillsLayout: string,
  skillsColumns: number,
  order: string[],
): React.ReactNode[] {
  const up = cfg.uppercase !== false;
  const bc = cfg.bulletChar ?? "›";
  const ss = cfg.section;

  const map: Record<string, React.ReactNode> = {
    summary: resume.summary ? (
      <React.Fragment key="summary">
        <SectionTitle style={ss} label="Summary" accent={accent} up={up} />
        <p style={{ margin: 0, color: "#333", lineHeight: "var(--line-height)" }}>{resume.summary}</p>
      </React.Fragment>
    ) : null,

    experience: resume.experiences.length > 0 ? (
      <React.Fragment key="experience">
        <SectionTitle style={ss} label="Experience" accent={accent} up={up} />
        {resume.experiences.map((e: WorkExperience) => (
          <div key={e.id} style={{ marginBottom: "var(--gap-content-blocks)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <strong style={{ fontSize: "10.5pt", color: "#1a1a1a" }}>{e.title}</strong>
                {e.company && <span style={{ color: accent, marginLeft: "6pt", fontWeight: 600 }}>{e.company}</span>}
                {e.location && <span style={{ color: "#888", marginLeft: "5pt", fontSize: "8.5pt" }}>· {e.location}</span>}
              </div>
              <span style={{ color: "#666", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
                {dateRange(e.startDate, e.endDate, e.current, dateFormat)}
              </span>
            </div>
            {e.bullets.length > 0 && (
              <ul style={{ margin: "3pt 0 0", paddingLeft: "0", listStyle: "none" }}>
                {e.bullets.map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: "5pt", marginBottom: "2pt" }}>
                    <span style={{ color: accent, flexShrink: 0, marginTop: "1pt", fontWeight: 600 }}>{bc}</span>
                    <span style={{ color: "#333" }}>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </React.Fragment>
    ) : null,

    education: resume.educations.length > 0 ? (
      <React.Fragment key="education">
        <SectionTitle style={ss} label="Education" accent={accent} up={up} />
        {resume.educations.map((e: Education) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--gap-inside)" }}>
            <div>
              <strong style={{ color: "#1a1a1a" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</strong>
              <span style={{ color: accent, marginLeft: "6pt" }}>{e.institution}</span>
              {e.gpa && <span style={{ color: "#777", fontSize: "8.5pt", marginLeft: "5pt" }}>· GPA {e.gpa}</span>}
            </div>
            <span style={{ color: "#666", fontSize: "8.5pt", whiteSpace: "nowrap", marginLeft: "8pt" }}>
              {dateRange(e.startDate, e.endDate, e.current, dateFormat)}
            </span>
          </div>
        ))}
      </React.Fragment>
    ) : null,

    skills: resume.skills.length > 0 ? (
      <React.Fragment key="skills">
        <SectionTitle style={ss} label="Skills" accent={accent} up={up} />
        {skillsLayout === "inline" ? (
          <div style={{ color: "#333", lineHeight: "var(--line-height)" }}>
            {resume.skills.map((s: Skill, i: number) => (
              <span key={i}>{s.name}{i < resume.skills.length - 1 ? <span style={{ color: accent, margin: "0 5pt" }}>·</span> : ""}</span>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${skillsColumns}, 1fr)`, gap: "2pt" }}>
            {resume.skills.map((s: Skill, i: number) => <span key={i} style={{ color: "#333" }}>• {s.name}</span>)}
          </div>
        )}
      </React.Fragment>
    ) : null,

    certifications: resume.certifications.length > 0 ? (
      <React.Fragment key="certifications">
        <SectionTitle style={ss} label="Certifications" accent={accent} up={up} />
        {resume.certifications.map((c: Certification, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3pt" }}>
            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{c.name}<span style={{ fontWeight: 400, color: "#555", marginLeft: "4pt" }}>· {c.issuer}</span></span>
            {c.date && <span style={{ color: "#666", fontSize: "8.5pt" }}>{c.date}</span>}
          </div>
        ))}
      </React.Fragment>
    ) : null,
  };

  return order.map(id => map[id] ?? null);
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ resume, accent, bgMode, showContact, sidebarPhoto = false }: {
  resume: TemplateProps["resume"];
  accent: string;
  bgMode: SidebarBgMode;
  showContact: boolean;
  sidebarPhoto?: boolean;
}) {
  const { personalInfo, skills, certifications, languages } = resume;
  const { dark } = sidebarPalette(bgMode, accent);
  const tc  = dark ? "rgba(255,255,255,0.88)" : "#333";
  const tc2 = dark ? "rgba(255,255,255,0.52)" : "#777";
  const ttl = dark ? "rgba(255,255,255,0.42)" : "#888";
  const div = dark ? "rgba(255,255,255,0.12)" : "#e5e7eb";
  const photoUrl = personalInfo.photoUrl;

  const T: React.CSSProperties = { fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: ttl, marginBottom: "6pt" };
  const D: React.CSSProperties = { borderTop: `1px solid ${div}`, marginTop: "12pt", paddingTop: "10pt" };
  const contacts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl].filter(Boolean);
  const hasAnything = showContact || skills.length > 0;

  return (
    <>
      {sidebarPhoto && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14pt" }}>
          <PhotoCircle
            url={photoUrl}
            size={70}
            border={dark ? "rgba(255,255,255,0.25)" : `${accent}40`}
          />
        </div>
      )}

      {showContact && (
        <>
          <div style={T}>Contact</div>
          {contacts.map((c, i) => (
            <div key={i} style={{ fontSize: "8pt", color: tc, marginBottom: "3pt", wordBreak: "break-all" }}>{c}</div>
          ))}
        </>
      )}

      {skills.length > 0 && (
        <div style={(showContact || sidebarPhoto) && hasAnything ? D : undefined}>
          <div style={T}>Skills</div>
          {skills.slice(0, 14).map((s: Skill, i: number) => (
            <div key={i} style={{ fontSize: "8.5pt", color: tc, marginBottom: "2.5pt" }}>· {s.name}</div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div style={D}>
          <div style={T}>Certifications</div>
          {certifications.map((c: Certification, i: number) => (
            <div key={i} style={{ marginBottom: "4pt" }}>
              <div style={{ fontSize: "8.5pt", fontWeight: 600, color: tc }}>{c.name}</div>
              <div style={{ fontSize: "7.5pt", color: tc2 }}>{c.issuer}</div>
            </div>
          ))}
        </div>
      )}

      {languages.length > 0 && (
        <div style={D}>
          <div style={T}>Languages</div>
          {languages.map((l: Language, i: number) => (
            <div key={i} style={{ fontSize: "8.5pt", color: tc, marginBottom: "2pt" }}>
              {l.name} <span style={{ color: tc2 }}>· {l.proficiency}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTemplate(cfg: EngineConfig): React.FC<TemplateProps> {
  const isBanner = ["banner-dark", "banner-accent", "two-tone"].includes(cfg.header);
  const isSidebar = cfg.layout !== "single";
  const sc = isSidebar ? (cfg.layout as SidebarCfg) : null;

  const T: React.FC<TemplateProps> = ({
    resume, mainColor, dateFormat, headerAlignment, skillsLayout, skillsColumns, sectionOrder,
  }) => {
    const { bg, dark } = sc ? sidebarPalette(sc.bg, mainColor) : { bg: "", dark: false };

    const root: React.CSSProperties = {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--size-body)",
      color: "#1a1a1a",
      lineHeight: "var(--line-height)",
      minHeight: "1123px",
    };

    if (isSidebar && sc) {
      const mainOrder = (sectionOrder ?? BODY_SECTIONS).filter(id => MAIN_ONLY.includes(id));
      const sidebarShowContact = !isBanner;
      const sidebarTopPad = isBanner ? "16pt" : "var(--margin-top)";
      const mainTopPad    = isBanner ? "14pt" : "0";
      const mainSidePad   = sc.side === "left"
        ? `${mainTopPad} 18pt var(--margin-top) 18pt`
        : `${mainTopPad} var(--margin-lr) var(--margin-top) 18pt`;

      const sidebarEl = (
        <div style={{ width: sc.width, background: bg, flexShrink: 0, color: dark ? "white" : "#1a1a1a", padding: `${sidebarTopPad} 14pt 24pt` }}>
          <SidebarContent
            resume={resume}
            accent={mainColor}
            bgMode={sc.bg}
            showContact={sidebarShowContact}
            sidebarPhoto={cfg.sidebarPhoto}
          />
        </div>
      );

      const mainEl = (
        <div style={{ flex: 1, padding: mainSidePad }}>
          {buildBody(resume, cfg, mainColor, dateFormat, skillsLayout, skillsColumns, mainOrder)}
        </div>
      );

      return (
        <div style={root}>
          <Header
            style={cfg.header}
            resume={resume}
            accent={mainColor}
            nameColor={cfg.nameColor}
            headlineColor={cfg.headlineColor}
            showContact={isBanner}
            showPhoto={cfg.showPhoto ?? false}
          />
          <div style={{ display: "flex" }}>
            {sc.side === "left" ? <>{sidebarEl}{mainEl}</> : <>{mainEl}{sidebarEl}</>}
          </div>
        </div>
      );
    }

    // Single column
    const order = sectionOrder ?? BODY_SECTIONS;
    return (
      <div style={root}>
        <Header
          style={cfg.header}
          resume={resume}
          accent={mainColor}
          nameColor={cfg.nameColor}
          headlineColor={cfg.headlineColor}
          showContact
          showPhoto={cfg.showPhoto ?? false}
        />
        <div style={{ padding: "0 var(--margin-lr) var(--margin-top)" }}>
          {buildBody(resume, cfg, mainColor, dateFormat, skillsLayout, skillsColumns, order)}
        </div>
      </div>
    );
  };

  T.displayName = "EngineTemplate";
  return T;
}
