import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { configInvalidate, CONFIG_SCHEMA } from "@/lib/config-service";
import { auth } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const group = req.nextUrl.searchParams.get("group");
  const where = group ? { group } : {};

  const rows = await prisma.systemConfig.findMany({ where, orderBy: { key: "asc" } });

  // Merge schema definitions with DB values
  const schemaItems = group ? CONFIG_SCHEMA.filter((s) => s.group === group) : CONFIG_SCHEMA;
  const dbMap = Object.fromEntries(rows.map((r) => [r.key, r]));

  const result = schemaItems.map((schema) => {
    const row = dbMap[schema.key];
    return {
      key: schema.key,
      group: schema.group,
      label: schema.label,
      description: schema.description ?? null,
      sensitive: schema.sensitive ?? false,
      valueType: schema.valueType,
      value: row ? (schema.sensitive ? "••••••••" : row.value) : null,
      hasValue: !!row,
      updatedAt: row?.updatedAt ?? null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { updates: Array<{ key: string; value: string }> };
  if (!Array.isArray(body.updates)) {
    return NextResponse.json({ error: "updates array required" }, { status: 400 });
  }

  const schemaKeys = new Set(CONFIG_SCHEMA.map((s) => s.key));
  const results = [];

  for (const { key, value } of body.updates) {
    if (!schemaKeys.has(key)) continue;
    const schema = CONFIG_SCHEMA.find((s) => s.key === key)!;
    const row = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, updatedBy: session?.user?.id },
      create: {
        key,
        value,
        group: schema.group,
        label: schema.label,
        description: schema.description,
        sensitive: schema.sensitive ?? false,
        valueType: schema.valueType,
        updatedBy: session?.user?.id,
      },
    });
    configInvalidate(key);
    results.push(row);
  }

  return NextResponse.json({ updated: results.length });
}

export async function DELETE(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await req.json() as { key: string };
  await prisma.systemConfig.deleteMany({ where: { key } });
  configInvalidate(key);
  return NextResponse.json({ success: true });
}

