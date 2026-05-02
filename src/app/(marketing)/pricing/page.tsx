"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PLANS = [
  {
    id: "BASIC",
    name: "Basic",
    icon: Zap,
    monthly: 9.99,
    yearly: 95.88,
    yearlyMonthly: 7.99,
    description: "Perfect for active job seekers",
    color: "from-blue-500 to-blue-600",
    features: [
      "Unlimited resumes",
      "50 AI enhancements/month (Claude Haiku)",
      "PDF & DOCX export",
      "All 8 professional templates",
      "ATS compatibility scoring",
      "Auto-save + version history (20 versions)",
      "Basic analytics",
    ],
    notIncluded: ["Job alignment", "Probability scoring", "LinkedIn automation", "Auto-apply", "Contact finder"],
  },
  {
    id: "PRO",
    name: "Pro",
    icon: Sparkles,
    monthly: 19.99,
    yearly: 191.88,
    yearlyMonthly: 15.99,
    description: "For serious job hunters",
    color: "from-indigo-500 to-indigo-600",
    popular: true,
    features: [
      "Everything in Basic",
      "Unlimited AI enhancements",
      "Job-aligned resume generator",
      "Interview probability scorer",
      "LinkedIn job fetcher (daily)",
      "Match threshold controls (50/70/100%)",
      "Cover letter generation",
      "Application tracking pipeline",
      "Unlimited version history",
    ],
    notIncluded: ["Auto-apply", "Contact finder", "Auto-messaging"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    icon: Crown,
    monthly: 39.99,
    yearly: 383.88,
    yearlyMonthly: 31.99,
    description: "Full automation suite",
    color: "from-purple-500 to-pink-500",
    features: [
      "Everything in Pro",
      "Auto-apply (10 jobs/month)",
      "Stops at final confirm — your approval",
      "HR/CEO contact finder",
      "Auto-messaging (10/month)",
      "Personalized outreach generation",
      "Response rate tracking",
      "Priority Claude Sonnet AI",
      "Dedicated support",
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  const handleCheckout = async (tier: string) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, interval: yearly ? "YEARLY" : "MONTHLY" }),
    });
    const { data } = await res.json();
    if (data?.url) window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b bg-white px-4 py-4">
        <div className="container flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ResumeAI Pro</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
        </div>
      </nav>

      <div className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg mb-8">Start free for 14 days. No credit card required.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 rounded-full bg-white border p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-all", !yearly ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700")}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-2", yearly ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700")}
            >
              Yearly
              <Badge className="bg-green-100 text-green-700 border-none text-xs px-1.5 py-0">-20%</Badge>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-200",
                plan.popular ? "ring-2 ring-indigo-500 shadow-xl scale-[1.02]" : "hover:shadow-lg"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              )}
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${plan.color} mb-3`}>
                  <plan.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${yearly ? plan.yearlyMonthly : plan.monthly}
                  </span>
                  <span className="text-gray-400 text-sm">/mo</span>
                  {yearly && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      Billed ${plan.yearly}/year (save ${((plan.monthly * 12) - plan.yearly).toFixed(2)})
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleCheckout(plan.id)}
                  className={cn("w-full", plan.popular ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white" : "")}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Start free trial
                </Button>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently asked questions</h2>
          <div className="space-y-6 text-left">
            {[
              { q: "What happens after the 14-day trial?", a: "You'll be asked to choose a plan. If you don't upgrade, your account stays on the free tier with limited AI enhancements." },
              { q: "Can I switch plans?", a: "Yes, upgrade or downgrade anytime. Changes take effect immediately and are prorated automatically." },
              { q: "Is the auto-apply safe?", a: "Absolutely. The system fills forms but stops at the final submission step. You always review and click submit. We never apply without your explicit approval." },
              { q: "What AI models are used?", a: "Free trial uses GPT-4o-mini. Basic and Pro use Claude Haiku for speed and cost efficiency. Enterprise uses Claude Sonnet — the highest quality model — with prompt caching for 90% cost savings on repeat operations." },
            ].map((item) => (
              <div key={item.q} className="rounded-lg bg-white border p-5">
                <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
                <p className="text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
