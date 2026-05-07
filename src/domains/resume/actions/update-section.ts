import { z } from "zod";
import type { Prisma, Resume } from "@prisma/client";
import type { ActionDefinition } from "@/ai-core";
import type { ResumeRepository } from "@/lib/db/repositories/resume.repository";
import { ACTION_IDS } from "../action-ids";

const SectionPatchSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("summary"), content: z.string().max(5000) }),
  z.object({ type: z.literal("personalInfo"), data: z.record(z.unknown()) }),
  z.object({ type: z.literal("skills"), data: z.array(z.unknown()) }),
  z.object({ type: z.literal("certifications"), data: z.array(z.unknown()) }),
  z.object({ type: z.literal("languages"), data: z.array(z.unknown()) }),
  z.object({ type: z.literal("awards"), data: z.array(z.unknown()) }),
  z.object({ type: z.literal("customSections"), data: z.array(z.unknown()) }),
]);

export type SectionPatch = z.infer<typeof SectionPatchSchema>;

const UpdateSectionInputSchema = z.object({
  resumeId: z.string().min(1),
  userId: z.string().min(1),
  section: SectionPatchSchema,
});

export type UpdateSectionInput = z.infer<typeof UpdateSectionInputSchema>;

export interface UpdateSectionOutput {
  resume: Resume;
}

export interface UpdateSectionDeps {
  resumes: Pick<ResumeRepository, "findByIdAndUser" | "update">;
}

function toUpdate(section: SectionPatch): Prisma.ResumeUpdateInput {
  switch (section.type) {
    case "summary":
      return { summary: section.content };
    case "personalInfo":
      return {
        personalInfo: section.data as Prisma.InputJsonValue,
      };
    case "skills":
    case "certifications":
    case "languages":
    case "awards":
    case "customSections":
      return {
        [section.type]: section.data as Prisma.InputJsonValue,
      } as Prisma.ResumeUpdateInput;
  }
}

export function createUpdateSectionAction(
  deps: UpdateSectionDeps,
): ActionDefinition<UpdateSectionInput, UpdateSectionOutput> {
  return {
    id: ACTION_IDS.UPDATE_SECTION,
    description:
      "Update a scalar section of a resume (summary, personalInfo, skills, certifications, languages, awards, customSections).",
    inputSchema: UpdateSectionInputSchema,
    async execute(input, ctx) {
      const existing = await deps.resumes.findByIdAndUser(
        input.resumeId,
        input.userId,
      );
      if (!existing) {
        throw new Error(`Resume not found or not owned by user: ${input.resumeId}`);
      }
      const resume = await deps.resumes.update(
        input.resumeId,
        toUpdate(input.section),
      );
      ctx.emit?.("resume.section.updated", {
        resumeId: input.resumeId,
        sectionType: input.section.type,
      });
      return { resume };
    },
  };
}
