import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { stripe, createOrRetrieveCustomer } from "@/lib/stripe/client";
import { getStripePriceId } from "@/lib/stripe/plans";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({
  tier: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
  interval: z.enum(["MONTHLY", "YEARLY"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = Schema.parse(await req.json());

    const priceId = getStripePriceId(body.tier, body.interval);
    if (!priceId) return err("Invalid plan selection", 400);

    const customerId = await createOrRetrieveCustomer(session.user.id, session.user.email!);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: { userId: session.user.id },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return ok({ url: checkoutSession.url });
  } catch (e) {
    return handleRouteError(e);
  }
}
