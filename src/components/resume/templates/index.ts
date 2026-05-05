import type { TemplateId } from "@/types/resume";
import type { TemplateProps } from "./types";

// ── Handcrafted templates ─────────────────────────────────────────────────────
import { ClassicTemplate }      from "./ClassicTemplate";
import { TraditionalTemplate }  from "./TraditionalTemplate";
import { ProfessionalTemplate } from "./ProfessionalTemplate";
import { PrimeATSTemplate }     from "./PrimeATSTemplate";
import { PureATSTemplate }      from "./PureATSTemplate";
import { SpecialistTemplate }   from "./SpecialistTemplate";
import { CleanTemplate }        from "./CleanTemplate";
import { SimpleATSTemplate }    from "./SimpleATSTemplate";

// ── Engine-generated templates ────────────────────────────────────────────────
import {
  ExecutiveTemplate, HeraldTemplate, SlateTemplate, MonarchTemplate,
  ChairmanTemplate, PinnacleTemplate, VelocityTemplate, NovaTemplate,
  DirectorTemplate, ZenithTemplate, ForgeTemplate, SignalTemplate,
  CriterionTemplate, ApexTemplate, VectorTemplate, ChromeTemplate, SummitTemplate,
  AtlasTemplate, LucidTemplate, HarborTemplate, GroveTemplate,
  ImpactTemplate, FrontierTemplate, JournalTemplate, CanvasTemplate,
  LegacyTemplate, ClarityTemplate, RefinedTemplate, OrbitTemplate,
  MeridianTemplate, FluxTemplate, ContourTemplate,
  EpochTemplate, ElementTemplate, VertexTemplate,
  AmbassadorTemplate, EnvoyTemplate, AxiomTemplate, LedgerTemplate,
  ConsulTemplate, PrismTemplate, ChapterTemplate,
} from "./generated-templates";

export const TEMPLATE_REGISTRY: Record<TemplateId, React.FC<TemplateProps>> = {
  // ── 8 handcrafted ─────────────────────────────────
  "classic":      ClassicTemplate,
  "traditional":  TraditionalTemplate,
  "professional": ProfessionalTemplate,
  "prime-ats":    PrimeATSTemplate,
  "pure-ats":     PureATSTemplate,
  "specialist":   SpecialistTemplate,
  "clean":        CleanTemplate,
  "simple-ats":   SimpleATSTemplate,

  // ── Dark banner (single) ──────────────────────────
  "executive":    ExecutiveTemplate,
  "herald":       HeraldTemplate,
  "slate":        SlateTemplate,
  "monarch":      MonarchTemplate,

  // ── Accent banner (single) ────────────────────────
  "chairman":     ChairmanTemplate,
  "pinnacle":     PinnacleTemplate,
  "velocity":     VelocityTemplate,
  "nova":         NovaTemplate,

  // ── Two-tone (single) ─────────────────────────────
  "director":     DirectorTemplate,
  "zenith":       ZenithTemplate,
  "forge":        ForgeTemplate,
  "signal":       SignalTemplate,

  // ── Split header (single) ─────────────────────────
  "criterion":    CriterionTemplate,
  "apex":         ApexTemplate,
  "vector":       VectorTemplate,
  "chrome":       ChromeTemplate,
  "summit":       SummitTemplate,

  // ── Stack-left (single) ───────────────────────────
  "atlas":        AtlasTemplate,
  "lucid":        LucidTemplate,
  "harbor":       HarborTemplate,
  "grove":        GroveTemplate,
  "impact":       ImpactTemplate,
  "frontier":     FrontierTemplate,
  "journal":      JournalTemplate,
  "canvas":       CanvasTemplate,

  // ── Stack-center (single) ─────────────────────────
  "legacy":       LegacyTemplate,
  "clarity":      ClarityTemplate,
  "refined":      RefinedTemplate,
  "orbit":        OrbitTemplate,

  // ── Line-accent (single) ──────────────────────────
  "meridian":     MeridianTemplate,
  "flux":         FluxTemplate,
  "contour":      ContourTemplate,

  // ── Underbar (single) ─────────────────────────────
  "epoch":        EpochTemplate,
  "element":      ElementTemplate,
  "vertex":       VertexTemplate,

  // ── Sidebar-left ──────────────────────────────────
  "ambassador":   AmbassadorTemplate,
  "envoy":        EnvoyTemplate,
  "axiom":        AxiomTemplate,
  "ledger":       LedgerTemplate,

  // ── Sidebar-right ─────────────────────────────────
  "consul":       ConsulTemplate,
  "prism":        PrismTemplate,
  "chapter":      ChapterTemplate,
};

export type { TemplateProps };
export {
  ClassicTemplate, TraditionalTemplate, ProfessionalTemplate, PrimeATSTemplate,
  PureATSTemplate, SpecialistTemplate, CleanTemplate, SimpleATSTemplate,
};
