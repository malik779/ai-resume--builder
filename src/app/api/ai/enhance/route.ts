import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateAIEnhancement } from "@/lib/features/gate";
import { getAIProvider, estimateCost } from "@/lib/ai/factory";
import { aiUsageRepository, resumeRepository } from "@/lib/db";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({
  resumeId: z.string(),
  sectionType: z.enum(["summary", "experience", "skills", "education", "projects"]),
  currentContent: z.string().min(1).max(5000),
  targetRole: z.string().max(100).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  honestyLevel: z.enum(["strict", "moderate", "creative"]).default("strict"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Burst-rate guard (Redis sliding window)
    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests. Please slow down.", 429);

    const body = Schema.parse(await req.json());

    // Verify resume ownership
    const resume = await resumeRepository.findByIdAndUser(body.resumeId, userId);
    if (!resume) return err("Resume not found", 404);

    const tier = await getUserTier(userId);

    // Tier gate
    const gate = await gateAIEnhancement(userId, tier);
    if (!gate.allowed) {
      return err(gate.reason, 402, "UPGRADE_REQUIRED");
    }

    const provider = getAIProvider(tier);
    const start = Date.now();
    const result = await provider.enhance({
      sectionType: body.sectionType,
      currentContent: body.currentContent,
      targetRole: body.targetRole,
      yearsExperience: body.yearsExperience,
      honestyLevel: body.honestyLevel,
    });
    const durationMs = Date.now() - start;

    // Log usage for billing/analytics
    await aiUsageRepository.create({
      user: { connect: { id: userId } },
      operation: "ENHANCE",
      model: provider.modelId,
      promptTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      success: true,
      metadata: { resumeId: body.resumeId, sectionType: body.sectionType },
    });

    return ok(result);
  } catch (e) {
    return handleRouteError(e);
  }
}
