import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { resumeRepository } from "@/lib/db";
import { ok, created, err, handleRouteError } from "@/lib/utils/api";

const CreateSchema = z.object({
  title: z.string().min(1).max(100).default("Untitled Resume"),
  templateId: z.string().default("modern"),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const resumes = await resumeRepository.findByUser(session.user.id);
    return ok(resumes);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = CreateSchema.parse(await req.json());

    const resume = await resumeRepository.create({
      user: { connect: { id: session.user.id } },
      title: body.title,
      templateId: body.templateId,
      personalInfo: {},
    });

    return created(resume);
  } catch (e) {
    return handleRouteError(e);
  }
}
