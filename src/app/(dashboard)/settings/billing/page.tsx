import { auth } from "@/lib/auth/config";
import { getUserTier } from "@/lib/auth/helpers";
import { subscriptionRepository, aiUsageRepository } from "@/lib/db";
import { getTierConfig, TIER_ORDER } from "@/lib/features/tiers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CreditCard, Zap, TrendingUp, Calendar } from "lucide-react";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [tier, sub, stats] = await Promise.all([
    getUserTier(userId),
    subscriptionRepository.findByUserId(userId),
    aiUsageRepository.getStats(userId),
  ]);

  const config = getTierConfig(tier);

  const openPortal = async () => {
    "use server";
    // Server action for billing portal redirect
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500">Manage your plan and payment details</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {sub?.status === "TRIALING" ? "Free trial" : `Billed ${sub?.billingInterval?.toLowerCase() ?? "monthly"}`}
              </CardDescription>
            </div>
            <Badge variant={tier === "ENTERPRISE" ? "enterprise" : tier === "PRO" ? "pro" : "secondary"} className="text-sm px-3 py-1">
              {config.displayName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-0.5">AI Enhancements</p>
              <p className="font-semibold text-gray-900">
                {config.aiEnhancementsPerMonth === -1 ? "Unlimited" : `${config.aiEnhancementsPerMonth}/month`}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-0.5">Used this month</p>
              <p className="font-semibold text-gray-900">{stats.byOperation.ENHANCE ?? 0}</p>
            </div>
          </div>

          {sub?.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Next billing: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
            </div>
          )}

          {sub?.stripeCustomerId ? (
            <form action="/api/stripe/portal" method="POST">
              <Button type="submit" variant="outline" className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Billing in Stripe
              </Button>
            </form>
          ) : (
            <Link href="/pricing">
              <Button variant="gradient" className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Usage stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byOperation).map(([op, count]) => (
              <div key={op} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{op.toLowerCase().replace(/_/g, " ")}</span>
                <span className="font-semibold text-gray-900">{count} uses</span>
              </div>
            ))}
            <div className="border-t pt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">Total AI cost</span>
              <span className="font-semibold text-gray-900">${stats.totalCostUsd.toFixed(4)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade prompts for lower tiers */}
      {tier !== "ENTERPRISE" && (
        <Card className="border-gradient-to-r from-blue-200 to-indigo-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">
                  Unlock {TIER_ORDER[TIER_ORDER.indexOf(tier) + 1]} features
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {tier === "FREE" ? "Get unlimited AI enhancements, PDF export, and ATS scoring" :
                   tier === "BASIC" ? "Get job alignment, probability scoring, and LinkedIn automation" :
                   "Get auto-apply, contact finder, and Claude Sonnet AI"}
                </p>
                <Link href="/pricing">
                  <Button size="sm" variant="gradient">View Upgrade Options</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
