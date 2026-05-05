import { requireAdmin } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { PricingEditor } from "@/components/admin/PricingEditor";

export default async function AdminPricingPage() {
  await requireAdmin();
  const plans = await prisma.pricingPlan.findMany({ orderBy: [{ tier: "asc" }, { interval: "asc" }] });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-1">Pricing Plans</h1>
      <p className="text-gray-400 text-sm mb-8">
        Set display prices, Stripe price IDs, and limited-time discounts per tier. Discounts are applied at checkout via a Stripe coupon.
      </p>
      <PricingEditor plans={plans} />
    </div>
  );
}

