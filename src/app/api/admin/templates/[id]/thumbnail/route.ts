import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { invalidateTemplateCache } from "@/lib/template-service";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "templates");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("thumbnail") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WEBP allowed" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 });
  }

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : "png";
  const filename = `${template.slug}.${ext}`;
  const publicPath = `/uploads/templates/${filename}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const updated = await prisma.template.update({ where: { id }, data: { thumbnail: publicPath } });
  invalidateTemplateCache();
  return NextResponse.json({ thumbnail: publicPath, template: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const updated = await prisma.template.update({ where: { id }, data: { thumbnail: null } });
  invalidateTemplateCache();
  return NextResponse.json({ template: updated });
}
