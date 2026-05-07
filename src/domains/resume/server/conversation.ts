import "server-only";
import type { SubscriptionTier } from "@prisma/client";
import { sessionId as toSessionId } from "@/ai-core";
import { chatRepository } from "@/lib/db";
import {
  executePlan,
  planConversationTurn,
  type ActionPlanItem,
  type ConversationTurn,
} from "../conversation";
import { resumeProviderRouter } from "../services/ai-provider";
import { getResumeActionRegistry, getResumeEventBus } from "./runtime";

export interface RunConversationTurnInput {
  chatSessionId: string;
  userId: string;
  resumeId?: string;
  message: string;
  tier: SubscriptionTier;
  signal?: AbortSignal;
}

export interface RunConversationTurnResult {
  reply: string;
  plan: ActionPlanItem[];
  rejectedItems: ActionPlanItem[];
  steps: { stepIndex: number; actionId: string; ok: boolean }[];
}

const MAX_HISTORY_TURNS = 20;

export async function runConversationTurn(
  input: RunConversationTurnInput,
): Promise<RunConversationTurnResult> {
  await chatRepository.upsertSession({
    id: input.chatSessionId,
    userId: input.userId,
    resumeId: input.resumeId,
  });

  await chatRepository.appendMessage({
    sessionId: input.chatSessionId,
    role: "USER",
    content: input.message,
  });

  const recent = await chatRepository.recentMessages(
    input.chatSessionId,
    MAX_HISTORY_TURNS,
  );
  // Last item is the user message we just appended; planner takes prior turns.
  const history: ConversationTurn[] = recent.slice(0, -1).map((m) => ({
    role: m.role.toLowerCase() as ConversationTurn["role"],
    content: m.content,
  }));

  const provider = resumeProviderRouter.forTier(input.tier);
  const events = getResumeEventBus();
  const registry = getResumeActionRegistry();
  const sid = toSessionId(input.chatSessionId);

  events.emit({
    type: "conversation.planning.started",
    sessionId: sid,
    payload: { tier: input.tier, modelId: provider.modelId },
  });

  const planResult = await planConversationTurn(
    { provider },
    history,
    input.message,
    input.signal,
  );

  events.emit({
    type: "conversation.planning.completed",
    sessionId: sid,
    payload: {
      plannedActionIds: planResult.plan.map((p) => p.actionId),
      rejectedCount: planResult.rejectedItems.length,
      modelId: planResult.modelId,
      costUsd: planResult.costUsd,
    },
  });

  await chatRepository.appendMessage({
    sessionId: input.chatSessionId,
    role: "ASSISTANT",
    content: planResult.reply,
    toolCalls: planResult.plan.length > 0
      ? (planResult.plan as unknown as object[])
      : undefined,
  });

  let steps: RunConversationTurnResult["steps"] = [];
  if (planResult.plan.length > 0) {
    const exec = await executePlan(
      { registry, events },
      planResult.plan,
      {
        sessionId: sid,
        userId: input.userId,
        tier: input.tier,
        signal: input.signal,
      },
    );
    steps = exec.steps.map((s) => ({
      stepIndex: s.stepIndex,
      actionId: s.actionId,
      ok: s.ok,
    }));

    await chatRepository.appendMessage({
      sessionId: input.chatSessionId,
      role: "TOOL",
      content: exec.ok
        ? `Executed ${exec.steps.length} step(s) successfully.`
        : `Plan halted after step ${exec.steps.length - 1}.`,
      toolCalls: { steps: exec.steps } as unknown as object,
    });
  }

  return {
    reply: planResult.reply,
    plan: planResult.plan,
    rejectedItems: planResult.rejectedItems,
    steps,
  };
}
