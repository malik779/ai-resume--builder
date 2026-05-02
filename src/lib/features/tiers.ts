import type { SubscriptionTier } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Tier configuration — single source of truth for feature access and limits.
// Update this file to adjust caps; no other code changes needed.
// ─────────────────────────────────────────────────────────────────────────────

export interface TierConfig {
  tier: SubscriptionTier;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  // AI limits
  aiEnhancementsPerMonth: number; // -1 = unlimited
  aiEnhancementsLifetime: number; // for free: 3 total; others: -1
  // Export
  pdfExport: boolean;
  docxExport: boolean;
  watermark: boolean;
  // Templates
  templateCount: number;
  atsScoring: boolean;
  // Pro features
  jobAlignment: boolean;
  probabilityScoring: boolean;
  linkedinJobFetcher: boolean;
  coverLetterGeneration: boolean;
  // Enterprise features
  autoApply: boolean;
  autoApplyPerMonth: number;
  contactFinder: boolean;
  autoMessaging: boolean;
  autoMessagingPerMonth: number;
  priorityAI: boolean;
  // Version history
  versionHistoryCount: number;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  FREE: {
    tier: "FREE",
    displayName: "Free Trial",
    monthlyPrice: 0,
    yearlyPrice: 0,
    aiEnhancementsPerMonth: 3,
    aiEnhancementsLifetime: 3,
    pdfExport: false,
    docxExport: false,
    watermark: true,
    templateCount: 8,
    atsScoring: false,
    jobAlignment: false,
    probabilityScoring: false,
    linkedinJobFetcher: false,
    coverLetterGeneration: false,
    autoApply: false,
    autoApplyPerMonth: 0,
    contactFinder: false,
    autoMessaging: false,
    autoMessagingPerMonth: 0,
    priorityAI: false,
    versionHistoryCount: 3,
  },
  BASIC: {
    tier: "BASIC",
    displayName: "Basic",
    monthlyPrice: 9.99,
    yearlyPrice: 95.88,
    aiEnhancementsPerMonth: 50,
    aiEnhancementsLifetime: -1,
    pdfExport: true,
    docxExport: true,
    watermark: false,
    templateCount: 8,
    atsScoring: true,
    jobAlignment: false,
    probabilityScoring: false,
    linkedinJobFetcher: false,
    coverLetterGeneration: false,
    autoApply: false,
    autoApplyPerMonth: 0,
    contactFinder: false,
    autoMessaging: false,
    autoMessagingPerMonth: 0,
    priorityAI: false,
    versionHistoryCount: 20,
  },
  PRO: {
    tier: "PRO",
    displayName: "Pro",
    monthlyPrice: 19.99,
    yearlyPrice: 191.88,
    aiEnhancementsPerMonth: -1,
    aiEnhancementsLifetime: -1,
    pdfExport: true,
    docxExport: true,
    watermark: false,
    templateCount: 8,
    atsScoring: true,
    jobAlignment: true,
    probabilityScoring: true,
    linkedinJobFetcher: true,
    coverLetterGeneration: true,
    autoApply: false,
    autoApplyPerMonth: 0,
    contactFinder: false,
    autoMessaging: false,
    autoMessagingPerMonth: 0,
    priorityAI: false,
    versionHistoryCount: -1,
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    displayName: "Enterprise",
    monthlyPrice: 39.99,
    yearlyPrice: 383.88,
    aiEnhancementsPerMonth: -1,
    aiEnhancementsLifetime: -1,
    pdfExport: true,
    docxExport: true,
    watermark: false,
    templateCount: 8,
    atsScoring: true,
    jobAlignment: true,
    probabilityScoring: true,
    linkedinJobFetcher: true,
    coverLetterGeneration: true,
    autoApply: true,
    autoApplyPerMonth: 10,
    contactFinder: true,
    autoMessaging: true,
    autoMessagingPerMonth: 10,
    priorityAI: true,
    versionHistoryCount: -1,
  },
};

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIG[tier];
}

export const TIER_ORDER: SubscriptionTier[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

export function tierAtLeast(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}
