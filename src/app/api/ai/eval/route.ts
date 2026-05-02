import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateLinkedInFetcher } from "@/lib/features/gate";
import { getAIProvider } from "@/lib/ai/factory";
import { aiUsageRepository, jobRepository } from "@/lib/db";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({
  jobId: z.string(),
  userProfile: z.record(z.unknown()),
  userPreferences: z.object({
    remote: z.boolean().optional(),
    salaryRange: z.string().optional(),
    location: z.string().optional(),
    companySize: z.string().optional(),
  }),
  threshold: z.union([z.literal(50), z.literal(70), z.literal(100)]).default(70),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests.", 429);

    const body = Schema.parse(await req.json());
    const tier = await getUserTier(userId);

    const gate = gateLinkedInFetcher(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const job = await jobRepository.findById(body.jobId);
    if (!job) return err("Job not found", 404);

    const provider = getAIProvider(tier);
    const start = Date.now();
    const result = await provider.evalJob({
      jobData: {
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: (job.requirements as string[]) ?? [],
        postedDate: job.postedAt?.toISOString(),
        applicantsCount: job.applicantsCount ?? undefined,
        url: job.url,
      },
      userProfile: body.userProfile,
      userPreferences: body.userPreferences,
      userThreshold: body.threshold,
    });
    const durationMs = Date.now() - start;

    // Persist evaluation result on the job record
    await jobRepository.update(body.jobId, {
      matchPercentage: result.matchPercentage,
      recommendation: result.recommendation,
      matchAnalysis: result as unknown as import("@prisma/client").Prisma.InputJsonValue,
      evaluated: true,
      evaluatedAt: new Date(),
    });

    await aiUsageRepository.create({
      user: { connect: { id: userId } },
      operation: "LINKEDIN_EVAL",
      model: provider.modelId,
      promptTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      success: true,
      metadata: { jobId: body.jobId },
    });

    return ok(result);
  } catch (e) {
    return handleRouteError(e);
  }
}
