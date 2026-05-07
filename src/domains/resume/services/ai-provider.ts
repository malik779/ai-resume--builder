import type { SubscriptionTier } from "@prisma/client";
import type { BaseAIProvider } from "@/lib/ai/providers/base.provider";
import { getAIProvider, estimateCost } from "@/lib/ai/factory";
import type {
  CompleteOptions,
  CompletionResult,
  IGenericProvider,
  ProviderTier,
} from "@/ai-core";

function stripJsonFence(text: string): string {
  return text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
}

export function createGenericProviderAdapter(
  base: BaseAIProvider,
): IGenericProvider {
  return {
    modelId: base.modelId,
    tier: "premium",

    async complete(
      prompt: string,
      opts?: CompleteOptions,
    ): Promise<CompletionResult<string>> {
      const start = Date.now();
      const { text, promptTokens, outputTokens } = await base.rawComplete(
        opts?.system ?? "",
        prompt,
      );
      const durationMs = Date.now() - start;
      return {
        output: text,
        meta: {
          modelId: base.modelId,
          promptTokens,
          outputTokens,
          durationMs,
          costUsd: estimateCost(base.modelId, promptTokens, outputTokens),
        },
      };
    },

    async completeJSON<T>(
      prompt: string,
      opts?: CompleteOptions,
    ): Promise<CompletionResult<T>> {
      const { output, meta } = await this.complete(prompt, opts);
      const cleaned = stripJsonFence(output);
      let parsed: T;
      try {
        parsed = JSON.parse(cleaned) as T;
      } catch {
        throw new Error(
          `AI returned invalid JSON: ${cleaned.slice(0, 200)}`,
        );
      }
      return { output: parsed, meta };
    },
  };
}

export interface ResumeRouteHints {
  tier: SubscriptionTier;
  preferTier?: ProviderTier;
  // 0..1 — when supplied, the router can choose a stronger model if a
  // previous parse came back below this threshold. Phase 5: reported but no
  // local LLM exists yet, so route() collapses to forTier(tier) for text
  // completion. Phase 6+ may wire local Ollama/llama.cpp here.
  minConfidence?: number;
}

export interface ResumeProviderRouter {
  forTier(tier: SubscriptionTier): IGenericProvider;
  // Optional so test fakes can omit it; the production resumeProviderRouter
  // always provides it.
  route?(hints: ResumeRouteHints): IGenericProvider;
}

// Promote a tier when a prior pass had low confidence.
function escalate(tier: SubscriptionTier): SubscriptionTier {
  if (tier === "FREE" || tier === "BASIC") return "PRO";
  if (tier === "PRO") return "ENTERPRISE";
  return tier;
}

// Pure routing decision — exported so smoke tests can assert without
// constructing real providers.
//
// Phase 5 lean: no local LLM provider exists for text completion. The
// local-first path lives in the document-extractor (worker → Claude vision
// fallback). preferTier="local" is treated as a no-op here. Confidence
// escalation bumps the user's chosen tier when minConfidence is high and the
// user is on a weak tier.
export function chooseTier(hints: ResumeRouteHints): SubscriptionTier {
  let tier = hints.tier;
  if (
    typeof hints.minConfidence === "number" &&
    hints.minConfidence > 0.7 &&
    tier !== "ENTERPRISE"
  ) {
    tier = escalate(tier);
  }
  return tier;
}

export const resumeProviderRouter: ResumeProviderRouter = {
  forTier(tier: SubscriptionTier): IGenericProvider {
    const base = getAIProvider(tier) as BaseAIProvider;
    return createGenericProviderAdapter(base);
  },

  route(hints: ResumeRouteHints): IGenericProvider {
    return this.forTier(chooseTier(hints));
  },
};
