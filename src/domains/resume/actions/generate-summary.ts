import { z } from "zod";
import type { ActionDefinition } from "@/ai-core";
import { buildEnhancePrompt } from "@/lib/ai/prompts/enhance.prompt";
import type { ResumeProviderRouter } from "../services/ai-provider";
import { getTier } from "../services/context";
import { ACTION_IDS } from "../action-ids";
import type { AiUsageRecorder } from "../server/telemetry";

const GenerateSummaryInputSchema = z.object({
  resumeId: z.string().min(1).optional(),
  currentContent: z.string().min(1).max(5000),
  targetRole: z.string().max(100).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  honestyLevel: z.enum(["strict", "moderate", "creative"]).default("strict"),
});

export type GenerateSummaryInput = z.infer<typeof GenerateSummaryInputSchema>;

export interface GenerateSummaryOutput {
  enhancedContent: string;
  suggestedKeywords: string[];
  improvementsMade: string[];
  confidenceScore: number;
  placeholderCount: number;
  readabilityScore: number;
  atsKeywordCoverage: number;
  modelId: string;
  costUsd: number;
}

export interface GenerateSummaryDeps {
  router: ResumeProviderRouter;
  aiUsage?: AiUsageRecorder;
}

interface RawEnhanceJson {
  enhanced_content?: string;
  suggested_keywords?: string[];
  improvements_made?: string[];
  confidence_score?: number;
  placeholder_count?: number;
  readability_score?: number;
  ats_keyword_coverage?: number;
}

export function createGenerateSummaryAction(
  deps: GenerateSummaryDeps,
): ActionDefinition<GenerateSummaryInput, GenerateSummaryOutput> {
  return {
    id: ACTION_IDS.GENERATE_SUMMARY,
    description:
      "Generate or enhance a resume summary using the AI provider for the user's tier. Returns structured enhancement output.",
    inputSchema: GenerateSummaryInputSchema,
    async execute(input, ctx) {
      const tier = getTier(ctx);
      const provider = deps.router.forTier(tier);

      const { system, user } = buildEnhancePrompt({
        sectionType: "summary",
        currentContent: input.currentContent,
        targetRole: input.targetRole,
        yearsExperience: input.yearsExperience,
        honestyLevel: input.honestyLevel,
      });

      ctx.emit?.("resume.summary.generating", {
        resumeId: input.resumeId,
        tier,
        modelId: provider.modelId,
      });

      const { output, meta } = await provider.completeJSON<RawEnhanceJson>(user, {
        system,
        signal: ctx.signal,
      });

      const result: GenerateSummaryOutput = {
        enhancedContent: String(output.enhanced_content ?? ""),
        suggestedKeywords: output.suggested_keywords ?? [],
        improvementsMade: output.improvements_made ?? [],
        confidenceScore: Number(output.confidence_score ?? 0),
        placeholderCount: Number(output.placeholder_count ?? 0),
        readabilityScore: Number(output.readability_score ?? 0),
        atsKeywordCoverage: Number(output.ats_keyword_coverage ?? 0),
        modelId: meta.modelId,
        costUsd: meta.costUsd,
      };

      if (deps.aiUsage && ctx.userId) {
        void deps.aiUsage.record({
          userId: ctx.userId,
          actionId: "resume.summary.generate",
          operation: "ENHANCE",
          model: meta.modelId,
          promptTokens: meta.promptTokens,
          outputTokens: meta.outputTokens,
          costUsd: meta.costUsd,
          durationMs: meta.durationMs,
          success: true,
          tier,
          sessionId: ctx.sessionId,
          resumeId: input.resumeId,
        });
      }

      ctx.emit?.("resume.summary.generated", {
        resumeId: input.resumeId,
        modelId: meta.modelId,
        costUsd: meta.costUsd,
        confidenceScore: result.confidenceScore,
      });

      return result;
    },
  };
}
