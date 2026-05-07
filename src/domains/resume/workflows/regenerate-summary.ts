import { z } from "zod";
import type { WorkflowDefinition } from "@/ai-core";
import { ACTION_IDS, WORKFLOW_IDS } from "../action-ids";
import type { GenerateSummaryInput, GenerateSummaryOutput } from "../actions/generate-summary";
import type { UpdateSectionInput } from "../actions/update-section";

export const RegenerateSummaryInputSchema = z.object({
  resumeId: z.string().min(1),
  userId: z.string().min(1),
  currentContent: z.string().min(1).max(5000),
  targetRole: z.string().max(100).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  honestyLevel: z.enum(["strict", "moderate", "creative"]).default("strict"),
});

export type RegenerateSummaryWorkflowInput = z.infer<typeof RegenerateSummaryInputSchema>;

export const regenerateSummaryWorkflow: WorkflowDefinition = {
  id: WORKFLOW_IDS.REGENERATE_SUMMARY,
  description:
    "Regenerate the resume summary with AI, then persist the new summary to the resume.",
  steps: [
    {
      id: "generate",
      actionId: ACTION_IDS.GENERATE_SUMMARY,
      resolveInput: (_state, initial) => {
        const i = initial as RegenerateSummaryWorkflowInput;
        const out: GenerateSummaryInput = {
          resumeId: i.resumeId,
          currentContent: i.currentContent,
          targetRole: i.targetRole,
          yearsExperience: i.yearsExperience,
          honestyLevel: i.honestyLevel,
        };
        return out;
      },
    },
    {
      id: "persist",
      actionId: ACTION_IDS.UPDATE_SECTION,
      resolveInput: (state, initial) => {
        const i = initial as RegenerateSummaryWorkflowInput;
        const generated = state.results["generate"] as GenerateSummaryOutput;
        const out: UpdateSectionInput = {
          resumeId: i.resumeId,
          userId: i.userId,
          section: { type: "summary", content: generated.enhancedContent },
        };
        return out;
      },
    },
  ],
};
