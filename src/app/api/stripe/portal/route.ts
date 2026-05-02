import { requireAuth } from "@/lib/auth/helpers";
import { stripe } from "@/lib/stripe/client";
import { subscriptionRepository } from "@/lib/db";
import { ok, err, handleRouteError } from "@/lib/utils/api";

export async function POST() {
  try {
    const session = await requireAuth();
    const sub = await subscriptionRepository.findByUserId(session.user.id);

    if (!sub?.stripeCustomerId) return err("No billing account found", 404);

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return ok({ url: portal.url });
  } catch (e) {
    return handleRouteError(e);
  }
}
