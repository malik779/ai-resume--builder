import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { resumeRepository, db } from "@/lib/db";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const UpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().optional(),
  summary: z.string().optional(),
  personalInfo: z.record(z.unknown()).optional(),
  skills: z.array(z.unknown()).optional(),
  certifications: z.array(z.unknown()).optional(),
  languages: z.array(z.unknown()).optional(),
  awards: z.array(z.unknown()).optional(),
  customSections: z.array(z.unknown()).optional(),
  // Relational updates are handled via dedicated sub-routes
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const resume = await resumeRepository.findByIdWithRelations(id);
    if (!resume || resume.userId !== session.user.id) return err("Resume not found", 404);

    return ok(resume);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = UpdateSchema.parse(await req.json());

    const existing = await resumeRepository.findByIdAndUser(id, session.user.id);
    if (!existing) return err("Resume not found", 404);

    const updated = await resumeRepository.update(id, body as Parameters<typeof resumeRepository.update>[1]);
    return ok(updated);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await resumeRepository.findByIdAndUser(id, session.user.id);
    if (!existing) return err("Resume not found", 404);

    await resumeRepository.delete(id);
    return ok({ deleted: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
