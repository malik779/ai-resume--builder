"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PricingPlan } from "@prisma/client";
import { Tag, Save } from "lucide-react";

type Tier = "BASIC" | "PRO" | "ENTERPRISE";
type Interval = "MONTHLY" | "YEARLY";

const TIERS: Tier[] = ["BASIC", "PRO", "ENTERPRISE"];
const INTERVALS: Interval[] = ["MONTHLY", "YEARLY"];

const TIER_COLORS: Record<Tier, string> = {
  BASIC: "text-blue-400",
  PRO: "text-violet-400",
  ENTERPRISE: "text-amber-400",
};

interface PlanState {
  amountCents: number;
  currency: string;
  stripePriceId: string;
  discountCents: string;
  discountLabel: string;
  discountExpiry: string;
  couponId: string;
  isActive: boolean;
}

function defaultState(plan?: PricingPlan): PlanState {
  return {
    amountCents: plan?.amountCents ?? 0,
    currency: plan?.currency ?? "usd",
    stripePriceId: plan?.stripePriceId ?? "",
    discountCents: plan?.discountCents ? String(plan.discountCents) : "",
    discountLabel: plan?.discountLabel ?? "",
    discountExpiry: plan?.discountExpiry ? new Date(plan.discountExpiry).toISOString().slice(0, 10) : "",
    couponId: plan?.couponId ?? "",
    isActive: plan?.isActive ?? true,
  };
}

export function PricingEditor({ plans }: { plans: PricingPlan[] }) {
  const planMap = Object.fromEntries(plans.map((p) => [`${p.tier}_${p.interval}`, p]));

  const [states, setStates] = useState<Record<string, PlanState>>(
    () => Object.fromEntries(
      TIERS.flatMap((tier) => INTERVALS.map((interval) => {
        const key = `${tier}_${interval}`;
        return [key, defaultState(planMap[key])];
      }))
    )
  );

  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const update = (key: string, field: keyof PlanState, value: string | number | boolean) => {
    setStates((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSave = async (tier: Tier, interval: Interval) => {
    const key = `${tier}_${interval}`;
    const s = states[key];
    setSaving(key);

    await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier,
        interval,
        stripePriceId: s.stripePriceId || undefined,
        amountCents: s.amountCents,
        currency: s.currency,
        discountCents: s.discountCents ? Number(s.discountCents) : undefined,
        discountLabel: s.discountLabel || undefined,
        discountExpiry: s.discountExpiry || undefined,
        couponId: s.couponId || undefined,
        isActive: s.isActive,
      }),
    });

    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved((p) => p === key ? null : p), 2000);
  };

  const hasDiscount = (key: string) => !!states[key].discountCents;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-8">
      {TIERS.map((tier) => (
        <div key={tier} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className={cn("text-sm font-semibold", TIER_COLORS[tier])}>{tier}</h2>
          </div>

          <div className="grid grid-cols-2 divide-x divide-gray-800">
            {INTERVALS.map((interval) => {
              const key = `${tier}_${interval}`;
              const s = states[key];
              const isSaving = saving === key;
              const isSaved  = saved  === key;

              return (
                <div key={interval} className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400">{interval}</span>
                    {hasDiscount(key) && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">
                        <Tag className="w-3 h-3" />
                        Discount active
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Regular Price (cents)">
                      <input type="number" min={0} value={s.amountCents} onChange={(e) => update(key, "amountCents", Number(e.target.value))}
                        className={INPUT} placeholder="1900" />
                      {s.amountCents > 0 && <p className="text-[10px] text-gray-500 mt-0.5">{formatPrice(s.amountCents)}</p>}
                    </Field>
                    <Field label="Currency">
                      <select value={s.currency} onChange={(e) => update(key, "currency", e.target.value)} className={SELECT}>
                        <option value="usd">USD</option>
                        <option value="eur">EUR</option>
                        <option value="gbp">GBP</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Stripe Price ID">
                    <input value={s.stripePriceId} onChange={(e) => update(key, "stripePriceId", e.target.value)}
                      className={INPUT} placeholder="price_1..." />
                  </Field>

                  {/* Discount section */}
                  <div className="border-t border-gray-800 pt-4 space-y-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Discount (optional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Discounted Price (cents)">
                        <input type="number" min={0} value={s.discountCents} onChange={(e) => update(key, "discountCents", e.target.value)}
                          className={INPUT} placeholder="999" />
                        {s.discountCents && Number(s.discountCents) > 0 && <p className="text-[10px] text-amber-400 mt-0.5">{formatPrice(Number(s.discountCents))}</p>}
                      </Field>
                      <Field label="Discount Label">
                        <input value={s.discountLabel} onChange={(e) => update(key, "discountLabel", e.target.value)}
                          className={INPUT} placeholder='e.g. "50% off launch"' />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Discount Expiry" hint="Leave blank = no expiry">
                        <input type="date" value={s.discountExpiry} onChange={(e) => update(key, "discountExpiry", e.target.value)}
                          className={INPUT} />
                      </Field>
                      <Field label="Stripe Coupon ID">
                        <input value={s.couponId} onChange={(e) => update(key, "couponId", e.target.value)}
                          className={INPUT} placeholder="coupon_..." />
                      </Field>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => update(key, "isActive", !s.isActive)}
                        className={cn("relative w-8 h-4 rounded-full transition-colors cursor-pointer", s.isActive ? "bg-violet-600" : "bg-gray-700")}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all", s.isActive ? "left-4" : "left-0.5")} />
                      </div>
                      <span className="text-[11px] text-gray-500">{s.isActive ? "Active" : "Inactive"}</span>
                    </label>

                    <button
                      onClick={() => handleSave(tier, interval)}
                      disabled={isSaving}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        isSaved ? "bg-emerald-700 text-white" : "bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                      )}
                    >
                      <Save className="w-3 h-3" />
                      {isSaved ? "Saved!" : isSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const INPUT  = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500";
const SELECT = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-violet-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500 mb-1">
        {label}{hint && <span className="ml-1 text-gray-600 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
