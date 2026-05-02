import type { SubscriptionTier, BillingInterval } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Stripe price mapping — connect tier + interval to Stripe Price IDs.
// Price IDs come from env so they can differ between test and production.
// ─────────────────────────────────────────────────────────────────────────────

export interface StripePlan {
  tier: SubscriptionTier;
  interval: BillingInterval;
  priceId: string;
  amount: number; // in cents
}

export function getStripePriceId(tier: SubscriptionTier, interval: BillingInterval): string {
  const map: Partial<Record<SubscriptionTier, Record<BillingInterval, string>>> = {
    BASIC: {
      MONTHLY: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
      YEARLY: process.env.STRIPE_PRICE_BASIC_YEARLY!,
    },
    PRO: {
      MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY!,
      YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY!,
    },
    ENTERPRISE: {
      MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
      YEARLY: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
    },
  };
  return map[tier]?.[interval] ?? "";
}

// Reverse lookup: Stripe price ID → tier + interval
export function getTierFromPriceId(priceId: string): { tier: SubscriptionTier; interval: BillingInterval } | null {
  const lookup: Record<string, { tier: SubscriptionTier; interval: BillingInterval }> = {
    [process.env.STRIPE_PRICE_BASIC_MONTHLY ?? ""]: { tier: "BASIC", interval: "MONTHLY" },
    [process.env.STRIPE_PRICE_BASIC_YEARLY ?? ""]: { tier: "BASIC", interval: "YEARLY" },
    [process.env.STRIPE_PRICE_PRO_MONTHLY ?? ""]: { tier: "PRO", interval: "MONTHLY" },
    [process.env.STRIPE_PRICE_PRO_YEARLY ?? ""]: { tier: "PRO", interval: "YEARLY" },
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? ""]: { tier: "ENTERPRISE", interval: "MONTHLY" },
    [process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? ""]: { tier: "ENTERPRISE", interval: "YEARLY" },
  };
  return lookup[priceId] ?? null;
}
