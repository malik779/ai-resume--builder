import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { userRepository, aiUsageRepository } from "@/lib/db";
import { getTierConfig } from "@/lib/features/tiers";
import { ok, handleRouteError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [user, tier, stats] = await Promise.all([
      userRepository.findWithSubscription(userId),
      getUserTier(userId),
      aiUsageRepository.getStats(userId),
    ]);

    return ok({
      user,
      tier,
      config: getTierConfig(tier),
      aiStats: stats,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
