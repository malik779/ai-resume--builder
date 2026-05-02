import type { SubscriptionTier } from "@prisma/client";
import { getTierConfig } from "./tiers";
import { aiUsageRepository } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Feature gate — enforces tier limits before any operation executes.
// All blocking checks live here; callers just throw or receive an error.
// ─────────────────────────────────────────────────────────────────────────────

export type GateResult = { allowed: true } | { allowed: false; reason: string; upgradeRequired: SubscriptionTier };

export async function gateAIEnhancement(userId: string, tier: SubscriptionTier): Promise<GateResult> {
  const config = getTierConfig(tier);

  if (tier === "FREE") {
    const lifetime = await aiUsageRepository.countLifetime(userId);
    if (lifetime >= config.aiEnhancementsLifetime) {
      return { allowed: false, reason: `Free trial allows ${config.aiEnhancementsLifetime} AI enhancements total.`, upgradeRequired: "BASIC" };
    }
    return { allowed: true };
  }

  if (config.aiEnhancementsPerMonth === -1) return { allowed: true };

  const thisMonth = await aiUsageRepository.countThisMonth(userId);
  if (thisMonth >= config.aiEnhancementsPerMonth) {
    return { allowed: false, reason: `Monthly limit of ${config.aiEnhancementsPerMonth} AI enhancements reached.`, upgradeRequired: "PRO" };
  }
  return { allowed: true };
}

export function gateExport(tier: SubscriptionTier): GateResult {
  const config = getTierConfig(tier);
  if (!config.pdfExport) {
    return { allowed: false, reason: "PDF/DOCX export requires a paid plan.", upgradeRequired: "BASIC" };
  }
  return { allowed: true };
}

export function gateJobAlignment(tier: SubscriptionTier): GateResult {
  if (!getTierConfig(tier).jobAlignment) {
    return { allowed: false, reason: "Job alignment requires Pro or higher.", upgradeRequired: "PRO" };
  }
  return { allowed: true };
}

export function gateProbabilityScore(tier: SubscriptionTier): GateResult {
  if (!getTierConfig(tier).probabilityScoring) {
    return { allowed: false, reason: "Probability scoring requires Pro or higher.", upgradeRequired: "PRO" };
  }
  return { allowed: true };
}

export function gateLinkedInFetcher(tier: SubscriptionTier): GateResult {
  if (!getTierConfig(tier).linkedinJobFetcher) {
    return { allowed: false, reason: "LinkedIn job fetcher requires Pro or higher.", upgradeRequired: "PRO" };
  }
  return { allowed: true };
}

export function gateContactFinder(tier: SubscriptionTier): GateResult {
  if (!getTierConfig(tier).contactFinder) {
    return { allowed: false, reason: "Contact finder requires Enterprise.", upgradeRequired: "ENTERPRISE" };
  }
  return { allowed: true };
}

export async function gateAutoApply(userId: string, tier: SubscriptionTier): Promise<GateResult> {
  const config = getTierConfig(tier);
  if (!config.autoApply) {
    return { allowed: false, reason: "Auto-apply requires Enterprise.", upgradeRequired: "ENTERPRISE" };
  }
  const { applicationRepository } = await import("@/lib/db");
  const usedThisMonth = await applicationRepository.countAutoApplyThisMonth(userId);
  if (usedThisMonth >= config.autoApplyPerMonth) {
    return { allowed: false, reason: `Auto-apply limit of ${config.autoApplyPerMonth}/month reached.`, upgradeRequired: "ENTERPRISE" };
  }
  return { allowed: true };
}
