import { z } from "zod";
import type { WorkflowDefinition } from "@/ai-core";
import { ACTION_IDS, WORKFLOW_IDS } from "../action-ids";
import {
  ParsedResumeSchema,
  type AutoBuildInput,
  type AutoBuildOutput,
  type ParseUploadInput,
  type ParseUploadOutput,
} from "../actions";

export const ParseAndBuildInputSchema = z.object({
  userId: z.string().min(1),
  rawText: z.string().min(50).max(60000),
  templateId: z.string().min(1).default("classic"),
  hint: z.string().max(200).optional(),
});
export type ParseAndBuildWorkflowInput = z.infer<typeof ParseAndBuildInputSchema>;

export const parseAndBuildWorkflow: WorkflowDefinition = {
  id: WORKFLOW_IDS.PARSE_AND_BUILD,
  description:
    "Parse pre-extracted resume text into a structured ParsedResume, then materialize it as a Resume row.",
  steps: [
    {
      id: "parse",
      actionId: ACTION_IDS.PARSE_UPLOAD,
      resolveInput: (_state, initial) => {
        const i = initial as ParseAndBuildWorkflowInput;
        const out: ParseUploadInput = {
          rawText: i.rawText,
          hint: i.hint,
        };
        return out;
      },
    },
    {
      id: "build",
      actionId: ACTION_IDS.AUTO_BUILD_FROM_PARSE,
      resolveInput: (state, initial) => {
        const i = initial as ParseAndBuildWorkflowInput;
        const parseOut = state.results["parse"] as ParseUploadOutput;
        const out: AutoBuildInput = {
          userId: i.userId,
          parsed: ParsedResumeSchema.parse(parseOut.parsed),
          templateId: i.templateId,
        };
        return out;
      },
    },
  ],
};

export type ParseAndBuildResult = {
  parse: ParseUploadOutput;
  build: AutoBuildOutput;
};
