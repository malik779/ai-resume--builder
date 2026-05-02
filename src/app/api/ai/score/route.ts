import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateProbabilityScore } from "@/lib/features/gate";
import { getAIProvider } from "@/lib/ai/factory";
import { aiUsageRepository } from "@/lib/db";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({
  alignedResume: z.record(z.unknown()),
  jobDescription: z.string().min(50).max(10000),
  companyContext: z.object({
    size: z.string().optional(),
    industry: z.string().optional(),
    hiringVelocity: z.string().optional(),
    competitionLevel: z.string().optional(),
  }).optional(),
  marketData: z.object({
    roleSeniority: z.string().optional(),
    avgApplicants: z.number().optional(),
    marketDemand: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests.", 429);

    const body = Schema.parse(await req.json());
    const tier = await getUserTier(userId);

    const gate = gateProbabilityScore(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const provider = getAIProvider(tier);
    const start = Date.now();
    const result = await provider.scoreJob({
      alignedResume: body.alignedResume as Parameters<typeof provider.scoreJob>[0]["alignedResume"],
      jobDescription: body.jobDescription,
      companyContext: body.companyContext,
      marketData: body.marketData,
    });
    const durationMs = Date.now() - start;

    await aiUsageRepository.create({
      user: { connect: { id: userId } },
      operation: "PROBABILITY_SCORE",
      model: provider.modelId,
      promptTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      success: true,
    });

    return ok(result);
  } catch (e) {
    return handleRouteError(e);
  }
}
