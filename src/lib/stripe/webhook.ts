import Stripe from "stripe";
import { stripe } from "./client";
import { getTierFromPriceId } from "./plans";
import { subscriptionRepository } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook handler — processes all subscription lifecycle events.
// Each handler is idempotent (safe to replay).
// ─────────────────────────────────────────────────────────────────────────────

export async function handleStripeWebhook(body: string, signature: string): Promise<void> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    throw new Error("Invalid Stripe webhook signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(sub);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const stripeSubscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const priceId = stripeSub.items.data[0]?.price.id;
  const tierInfo = priceId ? getTierFromPriceId(priceId) : null;

  await subscriptionRepository.updateByStripeSubscriptionId(stripeSubscriptionId, {
    stripeSubscriptionId,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    tier: tierInfo?.tier ?? "BASIC",
    billingInterval: tierInfo?.interval ?? "MONTHLY",
    status: "ACTIVE",
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
  });
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const priceId = stripeSub.items.data[0]?.price.id;
  const tierInfo = priceId ? getTierFromPriceId(priceId) : null;

  const sub = await subscriptionRepository.findByStripeSubscriptionId(stripeSub.id);
  if (!sub) return;

  await subscriptionRepository.update(sub.id, {
    tier: tierInfo?.tier ?? sub.tier,
    billingInterval: tierInfo?.interval ?? sub.billingInterval,
    status: mapStripeStatus(stripeSub.status),
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const sub = await subscriptionRepository.findByStripeSubscriptionId(stripeSub.id);
  if (!sub) return;
  await subscriptionRepository.update(sub.id, { status: "CANCELED", tier: "FREE" });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubId = (invoice as unknown as { subscription?: string }).subscription;
  if (!stripeSubId) return;
  const sub = await subscriptionRepository.findByStripeSubscriptionId(stripeSubId);
  if (!sub) return;
  await subscriptionRepository.update(sub.id, { status: "PAST_DUE" });
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  const map: Record<string, string> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
  };
  return (map[status] ?? "ACTIVE") as "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INCOMPLETE";
}
