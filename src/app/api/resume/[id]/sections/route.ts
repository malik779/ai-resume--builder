import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { resumeRepository, db } from "@/lib/db";
import { ok, err, handleRouteError } from "@/lib/utils/api";

// Handles create/update/delete for work experience, education, and projects
// via a unified sections endpoint with a `type` discriminator.

const ExperienceSchema = z.object({
  type: z.literal("experience"),
  action: z.enum(["create", "update", "delete", "reorder"]),
  id: z.string().optional(),
  data: z.object({
    company: z.string().optional(),
    title: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    bullets: z.array(z.string()).optional(),
    order: z.number().optional(),
  }).optional(),
  ids: z.array(z.string()).optional(), // for reorder
});

const EducationSchema = z.object({
  type: z.literal("education"),
  action: z.enum(["create", "update", "delete", "reorder"]),
  id: z.string().optional(),
  data: z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    gpa: z.string().optional(),
    order: z.number().optional(),
  }).optional(),
  ids: z.array(z.string()).optional(),
});

const ProjectSchema = z.object({
  type: z.literal("project"),
  action: z.enum(["create", "update", "delete", "reorder"]),
  id: z.string().optional(),
  data: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    url: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    order: z.number().optional(),
  }).optional(),
  ids: z.array(z.string()).optional(),
});

const SectionSchema = z.discriminatedUnion("type", [ExperienceSchema, EducationSchema, ProjectSchema]);

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id: resumeId } = await params;

    const resume = await resumeRepository.findByIdAndUser(resumeId, session.user.id);
    if (!resume) return err("Resume not found", 404);

    const body = SectionSchema.parse(await req.json());

    if (body.type === "experience") {
      if (body.action === "create" && body.data) {
        const result = await db.workExperience.create({ data: { resumeId, ...body.data, company: body.data.company ?? "", title: body.data.title ?? "", startDate: body.data.startDate ?? "", bullets: body.data.bullets ?? [] } });
        return ok(result);
      }
      if (body.action === "update" && body.id && body.data) {
        const result = await db.workExperience.update({ where: { id: body.id }, data: body.data });
        return ok(result);
      }
      if (body.action === "delete" && body.id) {
        await db.workExperience.delete({ where: { id: body.id } });
        return ok({ deleted: true });
      }
      if (body.action === "reorder" && body.ids) {
        await Promise.all(body.ids.map((id, order) => db.workExperience.update({ where: { id }, data: { order } })));
        return ok({ reordered: true });
      }
    }

    if (body.type === "education") {
      if (body.action === "create" && body.data) {
        const result = await db.education.create({ data: { resumeId, institution: body.data.institution ?? "", degree: body.data.degree ?? "", startDate: body.data.startDate ?? "", ...body.data } });
        return ok(result);
      }
      if (body.action === "update" && body.id && body.data) {
        const result = await db.education.update({ where: { id: body.id }, data: body.data });
        return ok(result);
      }
      if (body.action === "delete" && body.id) {
        await db.education.delete({ where: { id: body.id } });
        return ok({ deleted: true });
      }
    }

    if (body.type === "project") {
      if (body.action === "create" && body.data) {
        const result = await db.project.create({ data: { resumeId, name: body.data.name ?? "", bullets: body.data.bullets ?? [], techStack: body.data.techStack ?? [], ...body.data } });
        return ok(result);
      }
      if (body.action === "update" && body.id && body.data) {
        const result = await db.project.update({ where: { id: body.id }, data: body.data });
        return ok(result);
      }
      if (body.action === "delete" && body.id) {
        await db.project.delete({ where: { id: body.id } });
        return ok({ deleted: true });
      }
    }

    return err("Invalid action or type", 400);
  } catch (e) {
    return handleRouteError(e);
  }
}
