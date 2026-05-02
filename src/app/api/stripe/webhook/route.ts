import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe/webhook";

// Stripe needs the raw body — must not be parsed by Next.js
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  try {
    await handleStripeWebhook(body, signature);
    return new Response("OK", { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook error";
    return new Response(message, { status: 400 });
  }
}
