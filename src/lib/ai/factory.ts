import type { SubscriptionTier } from "@prisma/client";
import type { IAIProvider } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// AI Provider Factory — select the right model for the user's tier.
// Adding a new model means adding a new provider and a case here.
// ─────────────────────────────────────────────────────────────────────────────

export function getAIProvider(tier: SubscriptionTier): IAIProvider {
  switch (tier) {
    case "ENTERPRISE":
      // Enterprise: Claude Sonnet — highest quality, prompt cached
      return require("./providers/claude-sonnet.provider").claudeSonnetProvider();

    case "PRO":
    case "BASIC":
      // Basic + Pro: Claude Haiku — fast, cost-effective
      return require("./providers/claude-haiku.provider").claudeHaikuProvider();

    case "FREE":
    default:
      // Free trial: GPT-4o-mini — lowest cost
      return require("./providers/openai.provider").openAIProvider();
  }
}

// Cost per 1K tokens (USD) — used for usage tracking
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "claude-haiku-4-5-20251001": { input: 0.00025, output: 0.00125 },
  "claude-sonnet-4-6": { input: 0.003, output: 0.015 },
};

export function estimateCost(modelId: string, promptTokens: number, outputTokens: number): number {
  const rates = MODEL_COSTS[modelId] ?? { input: 0, output: 0 };
  return (promptTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}
