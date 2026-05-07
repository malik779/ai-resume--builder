import "server-only";
import type { AiOperation, Prisma } from "@prisma/client";
import { aiUsageRepository } from "@/lib/db";

export interface RecordAiUsageInput {
  userId: string;
  actionId: string;
  operation: AiOperation;
  model: string;
  promptTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  tier: string;
  source?: string;
  sessionId?: string;
  resumeId?: string;
}

export interface AiUsageRecorder {
  record(input: RecordAiUsageInput): Promise<void>;
}

export const aiUsageRecorder: AiUsageRecorder = {
  async record(input) {
    try {
      await aiUsageRepository.create({
        user: { connect: { id: input.userId } },
        operation: input.operation,
        model: input.model,
        promptTokens: input.promptTokens,
        outputTokens: input.outputTokens,
        costUsd: input.costUsd,
        durationMs: input.durationMs,
        success: input.success,
        errorMessage: input.errorMessage,
        metadata: {
          actionId: input.actionId,
          tier: input.tier,
          source: input.source,
          sessionId: input.sessionId,
          resumeId: input.resumeId,
        } as Prisma.InputJsonValue,
      });
    } catch {
      // telemetry should never block the user-facing flow
    }
  },
};
