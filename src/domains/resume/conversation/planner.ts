import type { IGenericProvider } from "@/ai-core";
import { ACTION_IDS } from "../action-ids";
import {
  ActionPlanItemSchema,
  PlannerOutputSchema,
  type ActionPlanItem,
  type ConversationTurn,
  type PlannerOutput,
} from "./types";

const PLANNER_SYSTEM = `You are an AI orchestration agent for an interactive resume builder.

The user is editing their resume. Your job is to interpret what the user said and emit a JSON plan listing zero or more actions to run, along with a short natural-language reply for the user.

Available actions:

1. resume.template.select
   Input: { "templateId": string }
   Use when the user asks to switch templates, change the design, or pick a different style.

2. resume.theme.apply
   Input: { "mainColor"?: hex string, "text"?: { "primaryFont"?: string, "lineHeight"?: number, "bodySize"?: number, ... }, "layout"?: { "format"?: "A4" | "US_LETTER", "headerAlignment"?: "left" | "center" | "right", ... } }
   Use when the user asks to change colors, fonts, sizes, spacing, or page layout.

3. resume.summary.generate
   Input: { "currentContent": string, "targetRole"?: string, "yearsExperience"?: number, "honestyLevel"?: "strict" | "moderate" | "creative" }
   Use when the user asks to rewrite, improve, or regenerate the summary section.

4. resume.section.update
   Input: { "section": { "type": "summary" | "personalInfo" | "skills" | "certifications" | "languages" | "awards" | "customSections", ... } }
   Use for direct content changes the user dictates verbatim.

Rules:
- Only use actionIds from the list above.
- If the user's intent is ambiguous, return an empty plan and ask a focused clarifying question in "reply".
- If the user is just chatting (e.g. "thanks", "hi"), return an empty plan and a brief friendly reply.
- Do not invent templateIds. If the user mentions a template you cannot match, ask which one in the reply.
- Output ONLY valid JSON matching this exact shape:

{
  "reply": "string",
  "plan": [{ "actionId": "string", "input": { ... } }]
}

No prose outside the JSON. No markdown code fences.`;

function renderHistory(history: ConversationTurn[]): string {
  if (history.length === 0) return "(no prior messages)";
  return history
    .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
    .join("\n");
}

function buildPlannerUserPrompt(
  history: ConversationTurn[],
  message: string,
): string {
  return `Conversation so far:
${renderHistory(history)}

User just said:
"${message}"

Respond with the JSON plan now.`;
}

export interface PlanResult {
  reply: string;
  plan: ActionPlanItem[];
  rejectedItems: ActionPlanItem[];
  modelId: string;
  costUsd: number;
}

const ALLOWED = new Set<string>(Object.values(ACTION_IDS));

export interface PlannerDeps {
  provider: IGenericProvider;
}

export async function planConversationTurn(
  deps: PlannerDeps,
  history: ConversationTurn[],
  message: string,
  signal?: AbortSignal,
): Promise<PlanResult> {
  const userPrompt = buildPlannerUserPrompt(history, message);
  const { output, meta } = await deps.provider.completeJSON<unknown>(
    userPrompt,
    { system: PLANNER_SYSTEM, signal },
  );

  const parsed = PlannerOutputSchema.safeParse(output);
  let safe: PlannerOutput;
  if (parsed.success) {
    safe = parsed.data;
  } else {
    // Provider returned malformed JSON shape — fall back to a clarifier reply.
    safe = {
      reply:
        "I had trouble understanding that. Could you rephrase, or be more specific about what you'd like to change?",
      plan: [],
    };
  }

  const allowed: ActionPlanItem[] = [];
  const rejected: ActionPlanItem[] = [];
  for (const item of safe.plan) {
    const itemParse = ActionPlanItemSchema.safeParse(item);
    if (!itemParse.success) {
      rejected.push(item);
      continue;
    }
    if (ALLOWED.has(itemParse.data.actionId)) {
      allowed.push(itemParse.data);
    } else {
      rejected.push(itemParse.data);
    }
  }

  return {
    reply: safe.reply,
    plan: allowed,
    rejectedItems: rejected,
    modelId: meta.modelId,
    costUsd: meta.costUsd,
  };
}
