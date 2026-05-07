import type { SubscriptionTier } from "@prisma/client";
import type { ActionContext } from "@/ai-core";

const VALID_TIERS: SubscriptionTier[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

export function getTier(ctx: ActionContext): SubscriptionTier {
  const t = ctx.metadata?.tier;
  if (typeof t === "string" && (VALID_TIERS as string[]).includes(t)) {
    return t as SubscriptionTier;
  }
  return "FREE";
}

export function getRequestUserId(ctx: ActionContext): string | undefined {
  return ctx.userId;
}
