import { z } from "zod";
import type { Prisma, Resume } from "@prisma/client";
import type { ActionDefinition } from "@/ai-core";
import type { ResumeRepository } from "@/lib/db/repositories/resume.repository";
import { ACTION_IDS } from "../action-ids";

const CreateResumeInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(100).default("Untitled Resume"),
  templateId: z.string().default("classic"),
});

export type CreateResumeInput = z.infer<typeof CreateResumeInputSchema>;

export interface CreateResumeOutput {
  resumeId: string;
  resume: Resume;
}

export interface CreateResumeDeps {
  resumes: Pick<ResumeRepository, "create">;
}

export function createCreateResumeAction(
  deps: CreateResumeDeps,
): ActionDefinition<CreateResumeInput, CreateResumeOutput> {
  return {
    id: ACTION_IDS.CREATE_RESUME,
    description: "Create a new empty resume for a user with a chosen template.",
    inputSchema: CreateResumeInputSchema,
    async execute(input, ctx) {
      const data: Prisma.ResumeCreateInput = {
        user: { connect: { id: input.userId } },
        title: input.title,
        templateId: input.templateId,
        personalInfo: {},
      };
      const resume = await deps.resumes.create(data);
      ctx.emit?.("resume.created", {
        resumeId: resume.id,
        userId: input.userId,
        templateId: resume.templateId,
      });
      return { resumeId: resume.id, resume };
    },
  };
}
