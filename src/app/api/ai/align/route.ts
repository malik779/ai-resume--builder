import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateJobAlignment } from "@/lib/features/gate";
import { getAIProvider } from "@/lib/ai/factory";
import { aiUsageRepository, resumeRepository, applicationRepository } from "@/lib/db";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(50).max(10000),
  companyInfo: z.object({
    size: z.string().optional(),
    industry: z.string().optional(),
    stage: z.string().optional(),
    cultureNotes: z.string().optional(),
  }).optional(),
  honestyLevel: z.enum(["strict", "moderate", "creative"]).default("strict"),
  emphasis: z.enum(["balanced", "skills", "experience", "leadership"]).default("balanced"),
  saveAsApplication: z.boolean().default(false),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  jobUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests.", 429);

    const body = Schema.parse(await req.json());
    const tier = await getUserTier(userId);

    const gate = gateJobAlignment(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const resume = await resumeRepository.findByIdWithRelations(body.resumeId);
    if (!resume || resume.userId !== userId) return err("Resume not found", 404);

    const provider = getAIProvider(tier);
    const start = Date.now();
    const result = await provider.alignJob({
      resumeJson: resume as unknown as Record<string, unknown>,
      jobDescription: body.jobDescription,
      companyInfo: body.companyInfo,
      honestyLevel: body.honestyLevel,
      emphasis: body.emphasis,
    });
    const durationMs = Date.now() - start;

    await aiUsageRepository.create({
      user: { connect: { id: userId } },
      operation: "JOB_ALIGN",
      model: provider.modelId,
      promptTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      success: true,
      metadata: { resumeId: body.resumeId },
    });

    // Optionally save as a tracked application
    let application = null;
    if (body.saveAsApplication) {
      application = await applicationRepository.create({
        user: { connect: { id: userId } },
        resume: { connect: { id: body.resumeId } },
        company: body.company ?? "Unknown",
        title: body.jobTitle ?? "Unknown",
        jobUrl: body.jobUrl,
        alignedResume: result as unknown as import("@prisma/client").Prisma.InputJsonValue,
        alignmentScore: result.matchAnalysis.overallScore,
        talkingPoints: result.interviewStrategy.talkingPoints as unknown as import("@prisma/client").Prisma.InputJsonValue,
      });
    }

    return ok({ alignment: result, application });
  } catch (e) {
    return handleRouteError(e);
  }
}
