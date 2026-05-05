// ─────────────────────────────────────────────────────────────────────────────
// TemplateService — dynamic template registry loaded from DB.
// HANDCRAFTED templates map to static React components in STATIC_REGISTRY.
// ENGINE templates are built on-the-fly via createTemplate(engineConfig).
// Results are cached in-memory with a short TTL.
// ─────────────────────────────────────────────────────────────────────────────

import type { TemplateId } from "@/types/resume";
import type { TemplateProps } from "@/components/resume/templates/types";
import type { FC } from "react";

// Static registry — the 8 handcrafted components + 42 engine-generated
// Imported lazily to avoid circular deps at module init time
async function getStaticRegistry(): Promise<Record<string, FC<TemplateProps>>> {
  const { TEMPLATE_REGISTRY } = await import("@/components/resume/templates");
  return TEMPLATE_REGISTRY as Record<string, FC<TemplateProps>>;
}

export interface TemplateMeta {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail: string | null;
  previewColor: string;
  tags: string[];
  minTier: string;
  isActive: boolean;
  displayOrder: number;
  type: "HANDCRAFTED" | "ENGINE";
}

interface CacheEntry {
  meta: TemplateMeta[];
  expiresAt: number;
}

let _cache: CacheEntry | null = null;
const CACHE_TTL_MS = 30_000;

export async function getActiveTemplates(): Promise<TemplateMeta[]> {
  if (_cache && _cache.expiresAt > Date.now()) return _cache.meta;

  try {
    const { db: prisma } = await import("@/lib/db");
    const rows = await prisma.template.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    if (rows.length > 0) {
      const meta = rows.map((r: { id: string; slug: string; name: string; description: string | null; thumbnail: string | null; previewColor: string; tags: string[]; minTier: string; isActive: boolean; displayOrder: number; type: string }) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        thumbnail: r.thumbnail,
        previewColor: r.previewColor,
        tags: r.tags,
        minTier: r.minTier,
        isActive: r.isActive,
        displayOrder: r.displayOrder,
        type: r.type as "HANDCRAFTED" | "ENGINE",
      }));
      _cache = { meta, expiresAt: Date.now() + CACHE_TTL_MS };
      return meta;
    }
  } catch {
    // DB unavailable — fall through to static registry
  }

  // Fallback: return static TEMPLATE_META
  const { TEMPLATE_META } = await import("@/types/resume");
  const fallback = (Object.entries(TEMPLATE_META) as [string, { name: string; description: string; previewColor: string; tags: string[] }][]).map(
    ([slug, m], i) => ({
      id: slug,
      slug,
      name: m.name,
      description: m.description,
      thumbnail: null,
      previewColor: m.previewColor,
      tags: m.tags,
      minTier: "FREE",
      isActive: true,
      displayOrder: i,
      type: "HANDCRAFTED" as const,
    })
  );
  return fallback;
}

export async function resolveTemplateComponent(slug: string): Promise<FC<TemplateProps> | null> {
  const staticReg = await getStaticRegistry();

  // Try static registry first (covers all 50 built-in templates)
  if (staticReg[slug]) return staticReg[slug];

  // Try DB ENGINE template
  try {
    const { db: dbClient } = await import("@/lib/db");
    const row = await dbClient.template.findUnique({ where: { slug } });
    if (row?.type === "ENGINE" && row.engineConfig) {
      const { createTemplate } = await import("@/components/resume/templates/engine");
      return createTemplate(row.engineConfig as unknown as Parameters<typeof createTemplate>[0]);
    }
  } catch {
    // pass
  }

  return null;
}

export function invalidateTemplateCache() {
  _cache = null;
}

// The 8 handcrafted templates to seed on first admin visit
export const HANDCRAFTED_SEED: Array<{
  slug: TemplateId;
  displayOrder: number;
  tags: string[];
  minTier: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
}> = [
  { slug: "classic",      displayOrder: 0, tags: ["free"],                 minTier: "FREE" },
  { slug: "traditional",  displayOrder: 1, tags: ["free"],                 minTier: "FREE" },
  { slug: "pure-ats",     displayOrder: 2, tags: ["ats", "free"],          minTier: "FREE" },
  { slug: "simple-ats",   displayOrder: 3, tags: ["ats", "free"],          minTier: "FREE" },
  { slug: "specialist",   displayOrder: 4, tags: [],                       minTier: "BASIC" },
  { slug: "clean",        displayOrder: 5, tags: ["two-column"],           minTier: "BASIC" },
  { slug: "professional", displayOrder: 6, tags: ["photo", "two-column"],  minTier: "PRO" },
  { slug: "prime-ats",    displayOrder: 7, tags: ["photo", "ats"],         minTier: "PRO" },
];
