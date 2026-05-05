// 42 engine-generated templates — each is a unique visual config
import { createTemplate } from "./engine";

// ── Dark banner (single column) ───────────────────────────────────────────────
export const ExecutiveTemplate   = createTemplate({ header: "banner-dark",   section: "underline", layout: "single", bulletChar: "▸" });
export const HeraldTemplate      = createTemplate({ header: "banner-dark",   section: "left-bar",  layout: "single", bulletChar: "–" });
export const SlateTemplate       = createTemplate({ header: "banner-dark",   section: "caps",      layout: "single", bulletChar: "›",  nameColor: "dark" });
export const MonarchTemplate     = createTemplate({ header: "banner-dark",   section: "side-dot",  layout: "single", bulletChar: "•",  showPhoto: true });

// ── Accent banner (single column) ─────────────────────────────────────────────
export const ChairmanTemplate    = createTemplate({ header: "banner-accent", section: "caps",      layout: "single", bulletChar: "›",  showPhoto: true });
export const PinnacleTemplate    = createTemplate({ header: "banner-accent", section: "side-dot",  layout: "single", bulletChar: "•" });
export const VelocityTemplate    = createTemplate({ header: "banner-accent", section: "left-bar",  layout: "single", bulletChar: "▸" });
export const NovaTemplate        = createTemplate({ header: "banner-accent", section: "underline", layout: "single", bulletChar: "–" });

// ── Two-tone (single column) ───────────────────────────────────────────────────
export const DirectorTemplate    = createTemplate({ header: "two-tone",      section: "underline", layout: "single", bulletChar: "▸" });
export const ZenithTemplate      = createTemplate({ header: "two-tone",      section: "badge",     layout: "single", bulletChar: "›" });
export const ForgeTemplate       = createTemplate({ header: "two-tone",      section: "left-bar",  layout: "single", bulletChar: "–" });
export const SignalTemplate      = createTemplate({ header: "two-tone",      section: "side-dot",  layout: "single", bulletChar: "•" });

// ── Split header (single column) ──────────────────────────────────────────────
export const CriterionTemplate   = createTemplate({ header: "split",         section: "left-bar",  layout: "single", bulletChar: "▸" });
export const ApexTemplate        = createTemplate({ header: "split",         section: "badge",     layout: "single", bulletChar: "›",  showPhoto: true });
export const VectorTemplate      = createTemplate({ header: "split",         section: "caps",      layout: "single", bulletChar: "–" });
export const ChromeTemplate      = createTemplate({ header: "split",         section: "overline",  layout: "single", bulletChar: "•",  showPhoto: true });
export const SummitTemplate      = createTemplate({ header: "split",         section: "side-dot",  layout: "single", bulletChar: "›" });

// ── Stack-left (single column) ────────────────────────────────────────────────
export const AtlasTemplate       = createTemplate({ header: "stack-left",    section: "overline",  layout: "single", bulletChar: "›" });
export const LucidTemplate       = createTemplate({ header: "stack-left",    section: "side-dot",  layout: "single", bulletChar: "•" });
export const HarborTemplate      = createTemplate({ header: "stack-left",    section: "underline", layout: "single", bulletChar: "▸", showPhoto: true });
export const GroveTemplate       = createTemplate({ header: "stack-left",    section: "left-bar",  layout: "single", bulletChar: "–" });
export const ImpactTemplate      = createTemplate({ header: "stack-left",    section: "filled",    layout: "single", bulletChar: "▸", nameColor: "accent", showPhoto: true });
export const FrontierTemplate    = createTemplate({ header: "stack-left",    section: "flanked",   layout: "single", bulletChar: "•" });
export const JournalTemplate     = createTemplate({ header: "stack-left",    section: "badge",     layout: "single", bulletChar: "›" });
export const CanvasTemplate      = createTemplate({ header: "stack-left",    section: "caps",      layout: "single", bulletChar: "–" });

// ── Stack-center (single column) ──────────────────────────────────────────────
export const LegacyTemplate      = createTemplate({ header: "stack-center",  section: "flanked",   layout: "single", bulletChar: "▸" });
export const ClarityTemplate     = createTemplate({ header: "stack-center",  section: "caps",      layout: "single", bulletChar: "•",  headlineColor: "muted" });
export const RefinedTemplate     = createTemplate({ header: "stack-center",  section: "underline", layout: "single", bulletChar: "›" });
export const OrbitTemplate       = createTemplate({ header: "stack-center",  section: "badge",     layout: "single", bulletChar: "–" });

// ── Line-accent (single column) ───────────────────────────────────────────────
export const MeridianTemplate    = createTemplate({ header: "line-accent",   section: "side-dot",  layout: "single", bulletChar: "›" });
export const FluxTemplate        = createTemplate({ header: "line-accent",   section: "flanked",   layout: "single", bulletChar: "•" });
export const ContourTemplate     = createTemplate({ header: "line-accent",   section: "badge",     layout: "single", bulletChar: "▸" });

// ── Underbar (single column) ───────────────────────────────────────────────────
export const EpochTemplate       = createTemplate({ header: "underbar",      section: "caps",      layout: "single", bulletChar: "›" });
export const ElementTemplate     = createTemplate({ header: "underbar",      section: "side-dot",  layout: "single", bulletChar: "•" });
export const VertexTemplate      = createTemplate({ header: "underbar",      section: "left-bar",  layout: "single", bulletChar: "▸" });

// ── Sidebar-left (photo in sidebar) ───────────────────────────────────────────
export const AmbassadorTemplate  = createTemplate({ header: "banner-dark",   section: "underline", layout: { side: "left", width: "30%", bg: "dark-navy"    }, bulletChar: "›",  sidebarPhoto: true });
export const EnvoyTemplate       = createTemplate({ header: "stack-left",    section: "left-bar",  layout: { side: "left", width: "28%", bg: "dark-charcoal" }, bulletChar: "▸",  sidebarPhoto: true });
export const AxiomTemplate       = createTemplate({ header: "split",         section: "underline", layout: { side: "left", width: "28%", bg: "light-gray"   }, bulletChar: "–" });
export const LedgerTemplate      = createTemplate({ header: "two-tone",      section: "caps",      layout: { side: "left", width: "28%", bg: "light-warm"   }, bulletChar: "•" });

// ── Sidebar-right (photo in sidebar) ──────────────────────────────────────────
export const ConsulTemplate      = createTemplate({ header: "banner-accent", section: "badge",     layout: { side: "right", width: "30%", bg: "dark-accent"  }, bulletChar: "›",  sidebarPhoto: true });
export const PrismTemplate       = createTemplate({ header: "stack-left",    section: "side-dot",  layout: { side: "right", width: "28%", bg: "light-gray"   }, bulletChar: "▸",  sidebarPhoto: true });
export const ChapterTemplate     = createTemplate({ header: "split",         section: "badge",     layout: { side: "right", width: "28%", bg: "light-accent" }, bulletChar: "•" });
