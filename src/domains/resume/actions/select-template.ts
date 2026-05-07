import { z } from "zod";
import type { Resume } from "@prisma/client";
import type { ActionDefinition } from "@/ai-core";
import type { ResumeRepository } from "@/lib/db/repositories/resume.repository";
import type { TemplateMeta } from "@/lib/template-service";
import { ACTION_IDS } from "../action-ids";

const SelectTemplateInputSchema = z.object({
  resumeId: z.string().min(1),
  userId: z.string().min(1),
  templateId: z.string().min(1),
});

export type SelectTemplateInput = z.infer<typeof SelectTemplateInputSchema>;

export interface SelectTemplateOutput {
  resume: Resume;
  template: TemplateMeta | null;
}

export interface SelectTemplateDeps {
  resumes: Pick<ResumeRepository, "findByIdAndUser" | "update">;
  listActiveTemplates: () => Promise<TemplateMeta[]>;
}

export function createSelectTemplateAction(
  deps: SelectTemplateDeps,
): ActionDefinition<SelectTemplateInput, SelectTemplateOutput> {
  return {
    id: ACTION_IDS.SELECT_TEMPLATE,
    description: "Set the resume's active template by slug or id.",
    inputSchema: SelectTemplateInputSchema,
    async execute(input, ctx) {
      const existing = await deps.resumes.findByIdAndUser(
        input.resumeId,
        input.userId,
      );
      if (!existing) {
        throw new Error(`Resume not found or not owned by user: ${input.resumeId}`);
      }
      const templates = await deps.listActiveTemplates();
      const template =
        templates.find((t) => t.slug === input.templateId || t.id === input.templateId) ??
        null;
      const resume = await deps.resumes.update(input.resumeId, {
        templateId: template?.slug ?? input.templateId,
      });
      ctx.emit?.("resume.template.selected", {
        resumeId: input.resumeId,
        templateId: resume.templateId,
        resolvedFrom: template ? "registry" : "raw",
      });
      return { resume, template };
    },
  };
}
