import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { invalidateTemplateCache, HANDCRAFTED_SEED } from "@/lib/template-service";
import { TEMPLATE_META } from "@/types/resume";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const templates = await prisma.template.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { slug, name, description, type, engineConfig, previewColor, tags, minTier, displayOrder } = body;

  if (!slug || !name || !type) {
    return NextResponse.json({ error: "slug, name, and type are required" }, { status: 400 });
  }

  const template = await prisma.template.create({
    data: { slug, name, description, type, engineConfig, previewColor: previewColor ?? "#374151", tags: tags ?? [], minTier: minTier ?? "FREE", displayOrder: displayOrder ?? 0 },
  });

  invalidateTemplateCache();
  return NextResponse.json(template, { status: 201 });
}

// Seed the 8 handcrafted templates — idempotent, safe to call multiple times
export async function PUT() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results = [];
  for (const seed of HANDCRAFTED_SEED) {
    const meta = TEMPLATE_META[seed.slug];
    if (!meta) continue;
    const template = await prisma.template.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        slug: seed.slug,
        name: meta.name,
        description: meta.description,
        type: "HANDCRAFTED",
        previewColor: meta.previewColor,
        tags: seed.tags,
        minTier: seed.minTier,
        displayOrder: seed.displayOrder,
        isActive: true,
      },
    });
    results.push(template);
  }

  invalidateTemplateCache();
  return NextResponse.json({ seeded: results.length, templates: results });
}

