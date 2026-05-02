import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateContactFinder } from "@/lib/features/gate";
import { getAIProvider } from "@/lib/ai/factory";
import { aiUsageRepository, db } from "@/lib/db";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({
  targetCompany: z.string().min(1).max(100),
  targetRole: z.string().min(1).max(100),
  companySize: z.enum(["startup", "mid", "enterprise"]),
  userProfile: z.object({
    name: z.string(),
    currentRole: z.string(),
    keyAchievement: z.string(),
    mutualConnections: z.array(z.string()).default([]),
  }),
  outreachType: z.enum(["application_followup", "networking", "referral_request", "informational"]),
  saveContacts: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests.", 429);

    const body = Schema.parse(await req.json());
    const tier = await getUserTier(userId);

    const gate = gateContactFinder(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const provider = getAIProvider(tier);
    const start = Date.now();
    const result = await provider.findContacts(body);
    const durationMs = Date.now() - start;

    await aiUsageRepository.create({
      user: { connect: { id: userId } },
      operation: "CONTACT_FIND",
      model: provider.modelId,
      promptTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      success: true,
    });

    // Save primary contact to DB for future outreach tracking
    if (body.saveContacts) {
      await db.contact.create({
        data: {
          userId,
          likelyTitle: result.primaryContact.likelyTitle,
          company: body.targetCompany,
          linkedinSearchStrategy: result.primaryContact.searchStrategy,
          department: result.primaryContact.department,
          priority: result.primaryContact.priority,
          rationale: result.primaryContact.rationale,
        },
      });
    }

    return ok(result);
  } catch (e) {
    return handleRouteError(e);
  }
}
