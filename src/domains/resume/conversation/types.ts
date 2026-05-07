import { z } from "zod";
import { ACTION_IDS } from "../action-ids";

// The planner is constrained to this closed set of ActionIds. Adding a new
// resume action means adding it here AND in the planner system prompt.
//
// Note: PARSE_UPLOAD and AUTO_BUILD_FROM_PARSE are NOT plannable. They run
// only via the parse-and-build workflow triggered by an explicit upload, not
// from free-form chat — the planner can't fabricate a rawText payload.
export const PLANNABLE_ACTION_IDS = [
  ACTION_IDS.SELECT_TEMPLATE,
  ACTION_IDS.APPLY_THEME,
  ACTION_IDS.GENERATE_SUMMARY,
  ACTION_IDS.UPDATE_SECTION,
] as const;

export type PlannableActionId = (typeof PLANNABLE_ACTION_IDS)[number];

export const ActionPlanItemSchema = z.object({
  actionId: z.string(),
  input: z.record(z.unknown()),
});

export const PlannerOutputSchema = z.object({
  reply: z.string().min(1),
  plan: z.array(ActionPlanItemSchema).default([]),
});

export type ActionPlanItem = z.infer<typeof ActionPlanItemSchema>;
export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;

export interface ConversationTurn {
  role: "user" | "assistant" | "tool";
  content: string;
}
