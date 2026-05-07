import type {
  ActionContext,
  ActionId,
  ActionRegistry,
  EventBus,
  SessionId,
} from "@/ai-core";
import type { SubscriptionTier } from "@prisma/client";
import type { ActionPlanItem } from "./types";

export interface ExecuteOptions {
  sessionId: SessionId;
  userId: string;
  tier: SubscriptionTier;
  signal?: AbortSignal;
}

export interface ExecutionStepResult {
  stepIndex: number;
  actionId: string;
  ok: boolean;
  output?: unknown;
  error?: { code: string; message: string };
}

export interface ExecutionResult {
  steps: ExecutionStepResult[];
  ok: boolean;
}

export interface ExecutorDeps {
  registry: ActionRegistry;
  events: EventBus;
}

export async function executePlan(
  deps: ExecutorDeps,
  plan: ActionPlanItem[],
  opts: ExecuteOptions,
): Promise<ExecutionResult> {
  const ctx: ActionContext = {
    sessionId: opts.sessionId,
    userId: opts.userId,
    metadata: { tier: opts.tier },
    signal: opts.signal,
    emit: (type, payload) =>
      deps.events.emit({
        type,
        sessionId: opts.sessionId,
        payload,
      }),
  };

  const steps: ExecutionStepResult[] = [];

  deps.events.emit({
    type: "conversation.plan.started",
    sessionId: opts.sessionId,
    payload: { stepCount: plan.length, actionIds: plan.map((p) => p.actionId) },
  });

  for (let i = 0; i < plan.length; i++) {
    if (opts.signal?.aborted) break;
    const item = plan[i];

    deps.events.emit({
      type: "conversation.step.started",
      sessionId: opts.sessionId,
      payload: { stepIndex: i, actionId: item.actionId },
    });

    const result = await deps.registry.execute(
      item.actionId as ActionId,
      item.input,
      ctx,
    );

    if (result.ok) {
      steps.push({
        stepIndex: i,
        actionId: item.actionId,
        ok: true,
        output: result.output,
      });
      deps.events.emit({
        type: "conversation.step.completed",
        sessionId: opts.sessionId,
        payload: { stepIndex: i, actionId: item.actionId, output: result.output },
      });
    } else {
      steps.push({
        stepIndex: i,
        actionId: item.actionId,
        ok: false,
        error: { code: result.error.code, message: result.error.message },
      });
      deps.events.emit({
        type: "conversation.step.failed",
        sessionId: opts.sessionId,
        payload: { stepIndex: i, actionId: item.actionId, error: result.error },
      });
      // Stop on first failure — keeps the conversation honest about what
      // ran and what didn't.
      break;
    }
  }

  const ok = steps.every((s) => s.ok);
  deps.events.emit({
    type: ok ? "conversation.plan.completed" : "conversation.plan.failed",
    sessionId: opts.sessionId,
    payload: { steps },
  });

  return { steps, ok };
}
