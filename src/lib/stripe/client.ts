import Stripe from "stripe";

// Singleton Stripe client — Node.js Stripe SDK v17
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export async function createOrRetrieveCustomer(userId: string, email: string): Promise<string> {
  const { subscriptionRepository } = await import("@/lib/db");
  const sub = await subscriptionRepository.findByUserId(userId);

  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await subscriptionRepository.updateByUserId(userId, { stripeCustomerId: customer.id });
  return customer.id;
}
