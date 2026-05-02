import { auth } from "./config";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { SubscriptionTier } from "@prisma/client";
import { subscriptionRepository } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Server-side auth helpers for API routes and Server Components
// ─────────────────────────────────────────────────────────────────────────────

// Callers get a session with user.id guaranteed non-null (redirect throws if not).
type AuthSession = Session & { user: NonNullable<Session["user"]> & { id: string } };

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session as AuthSession;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

// Returns the user's current subscription tier.
// Falls back to DB if JWT tier is stale.
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) return "FREE";

  // Expired trial → downgrade gracefully
  if (sub.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt < new Date()) {
    return "FREE";
  }

  if (sub.status === "ACTIVE" || sub.status === "TRIALING") return sub.tier;
  return "FREE";
}

export async function assertTier(userId: string, required: SubscriptionTier): Promise<void> {
  const tier = await getUserTier(userId);
  const TIERS: SubscriptionTier[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  if (TIERS.indexOf(tier) < TIERS.indexOf(required)) {
    throw new UpgradeRequiredError(required);
  }
}

export class UpgradeRequiredError extends Error {
  readonly requiredTier: SubscriptionTier;
  constructor(tier: SubscriptionTier) {
    super(`Upgrade to ${tier} required`);
    this.name = "UpgradeRequiredError";
    this.requiredTier = tier;
  }
}
