import { z } from "zod";

// Canonical resume template config.
//
// This is the shape Phase 6's screenshot-ingestion pipeline emits, and the
// shape any new template authoring tool should consume. The legacy
// `EngineConfig` in src/components/resume/templates/engine.tsx maps to this
// via fromEngineConfig(); existing engine renderers continue to run in
// parallel until visual snapshot tests are in place (deferred to Phase 2.5).

export const SectionIdSchema = z.enum([
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "contact",
]);
export type SectionId = z.infer<typeof SectionIdSchema>;

export const LayoutShellSchema = z.enum([
  "single-column",
  "two-column",
  "sidebar-left",
  "sidebar-right",
]);
export type LayoutShell = z.infer<typeof LayoutShellSchema>;

export const HeaderStyleSchema = z.enum([
  "stack-left",
  "stack-center",
  "split",
  "banner-dark",
  "banner-accent",
  "two-tone",
  "line-accent",
  "underbar",
]);
export type HeaderStyle = z.infer<typeof HeaderStyleSchema>;

export const SectionStyleSchema = z.enum([
  "underline",
  "overline",
  "left-bar",
  "filled",
  "caps",
  "flanked",
  "badge",
  "side-dot",
]);
export type SectionStyle = z.infer<typeof SectionStyleSchema>;

export const SidebarBgModeSchema = z.enum([
  "dark-navy",
  "dark-charcoal",
  "dark-accent",
  "light-gray",
  "light-warm",
  "light-accent",
]);
export type SidebarBgMode = z.infer<typeof SidebarBgModeSchema>;

export const TemplateStyleSchema = z.object({
  header: HeaderStyleSchema,
  section: SectionStyleSchema,
  bulletChar: z.string().min(1).max(2).optional(),
  nameColor: z.enum(["dark", "accent"]).optional(),
  headlineColor: z.enum(["accent", "muted"]).optional(),
  uppercase: z.boolean().optional(),
  showPhoto: z.boolean().optional(),
  sidebarPhoto: z.boolean().optional(),
});
export type TemplateStyle = z.infer<typeof TemplateStyleSchema>;

export const TemplateRegionsSchema = z.object({
  main: z.array(SectionIdSchema).min(1),
  sidebar: z.array(SectionIdSchema).optional(),
});
export type TemplateRegions = z.infer<typeof TemplateRegionsSchema>;

export const SidebarConfigSchema = z.object({
  widthPct: z.number().int().min(15).max(45),
  bg: SidebarBgModeSchema,
});
export type SidebarConfig = z.infer<typeof SidebarConfigSchema>;

export const TemplateCompositionSchema = z.object({
  layoutVariant: z.string().optional(),
  headerPosition: z.enum(["inline", "full-width"]).optional(),
  sidebarAlign: z.enum(["top", "center", "stretch"]).optional(),
  sidebarStyle: z.enum(["solid", "card", "minimal"]).optional(),
});
export type TemplateComposition = z.infer<typeof TemplateCompositionSchema>;

export const TemplateConfigSchema = z
  .object({
    shell: LayoutShellSchema,
    regions: TemplateRegionsSchema,
    style: TemplateStyleSchema,
    sidebar: SidebarConfigSchema.optional(),
    composition: TemplateCompositionSchema.optional(),
  })
  .superRefine((cfg, ctx) => {
    const isSidebarShell =
      cfg.shell === "sidebar-left" || cfg.shell === "sidebar-right";
    if (isSidebarShell && !cfg.sidebar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sidebar"],
        message: "sidebar is required when shell is sidebar-left or sidebar-right",
      });
    }
    if (isSidebarShell && (!cfg.regions.sidebar || cfg.regions.sidebar.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["regions", "sidebar"],
        message: "regions.sidebar must be non-empty for sidebar shells",
      });
    }
  });
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

export function parseTemplateConfig(input: unknown): TemplateConfig {
  return TemplateConfigSchema.parse(input);
}

export function safeParseTemplateConfig(input: unknown) {
  return TemplateConfigSchema.safeParse(input);
}
