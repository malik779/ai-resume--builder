import type { EngineConfig } from "@/components/resume/templates/engine";
import {
  parseTemplateConfig,
  type LayoutShell,
  type SectionId,
  type SidebarBgMode,
  type SidebarConfig,
  type TemplateConfig,
  type TemplateRegions,
} from "./types";

// EngineConfig (legacy) → TemplateConfig (canonical) converter.
//
// Used to feed legacy 42-template ENGINE configs through the canonical schema
// for validation and Phase 6 ingestion pipelines. The legacy renderer
// (engine.tsx createTemplate) continues to consume EngineConfig directly until
// the unification work in a later phase.

const DEFAULT_SINGLE_MAIN: SectionId[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
];
const DEFAULT_SIDEBAR_MAIN: SectionId[] = ["summary", "experience", "education"];
const DEFAULT_SIDEBAR_REGION: SectionId[] = [
  "contact",
  "skills",
  "certifications",
  "languages",
];

function shellFromEngine(cfg: EngineConfig): LayoutShell {
  if (cfg.shell) {
    return cfg.shell === "single" ? "single-column" : cfg.shell;
  }
  if (!cfg.layout || cfg.layout === "single") return "single-column";
  return cfg.layout.side === "left" ? "sidebar-left" : "sidebar-right";
}

function regionsFromEngine(cfg: EngineConfig, shell: LayoutShell): TemplateRegions {
  if (cfg.regions) {
    const main = (cfg.regions.main as SectionId[]) ?? DEFAULT_SINGLE_MAIN;
    const sidebar = (cfg.regions.sidebar as SectionId[] | undefined) ?? undefined;
    return sidebar !== undefined ? { main, sidebar } : { main };
  }
  if (shell === "single-column" || shell === "two-column") {
    return { main: DEFAULT_SINGLE_MAIN };
  }
  return { main: DEFAULT_SIDEBAR_MAIN, sidebar: DEFAULT_SIDEBAR_REGION };
}

function sidebarFromEngine(cfg: EngineConfig): SidebarConfig | undefined {
  if (cfg.sidebar) {
    return { widthPct: cfg.sidebar.width, bg: cfg.sidebar.bg };
  }
  if (cfg.layout && cfg.layout !== "single") {
    const widthPct = parseInt(String(cfg.layout.width), 10);
    return {
      widthPct: Number.isFinite(widthPct) ? widthPct : 30,
      bg: cfg.layout.bg as SidebarBgMode,
    };
  }
  return undefined;
}

export function fromEngineConfig(cfg: EngineConfig): TemplateConfig {
  const shell = shellFromEngine(cfg);
  const regions = regionsFromEngine(cfg, shell);
  const sidebar = sidebarFromEngine(cfg);

  const draft = {
    shell,
    regions,
    style: {
      header: cfg.header,
      section: cfg.section,
      bulletChar: cfg.bulletChar,
      nameColor: cfg.nameColor,
      headlineColor: cfg.headlineColor,
      uppercase: cfg.uppercase,
      showPhoto: cfg.showPhoto,
      sidebarPhoto: cfg.sidebarPhoto,
    },
    sidebar,
    composition: cfg.composition,
  };

  return parseTemplateConfig(draft);
}
