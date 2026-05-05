import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import type { SubscriptionTier, BillingInterval } from "@prisma/client";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plans = await prisma.pricingPlan.findMany({ orderBy: [{ tier: "asc" }, { interval: "asc" }] });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    tier: SubscriptionTier;
    interval: BillingInterval;
    stripePriceId?: string;
    amountCents: number;
    currency?: string;
    discountCents?: number;
    discountLabel?: string;
    discountExpiry?: string;
    couponId?: string;
    isActive?: boolean;
  };

  const plan = await prisma.pricingPlan.upsert({
    where: { tier_interval: { tier: body.tier, interval: body.interval } },
    update: {
      stripePriceId: body.stripePriceId,
      amountCents: body.amountCents,
      currency: body.currency ?? "usd",
      discountCents: body.discountCents ?? null,
      discountLabel: body.discountLabel ?? null,
      discountExpiry: body.discountExpiry ? new Date(body.discountExpiry) : null,
      couponId: body.couponId ?? null,
      isActive: body.isActive ?? true,
    },
    create: {
      tier: body.tier,
      interval: body.interval,
      stripePriceId: body.stripePriceId,
      amountCents: body.amountCents,
      currency: body.currency ?? "usd",
      discountCents: body.discountCents ?? null,
      discountLabel: body.discountLabel ?? null,
      discountExpiry: body.discountExpiry ? new Date(body.discountExpiry) : null,
      couponId: body.couponId ?? null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(plan);
}

