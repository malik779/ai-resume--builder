"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Zap, Check } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui.store";
import { Button } from "@/components/ui/button";

const TIER_FEATURES: Record<string, { name: string; price: string; features: string[] }> = {
  BASIC: {
    name: "Basic",
    price: "$9.99/mo",
    features: ["Unlimited AI enhancements (50/mo)", "PDF & DOCX export", "ATS compatibility scoring", "8 professional templates", "Version history"],
  },
  PRO: {
    name: "Pro",
    price: "$19.99/mo",
    features: ["Everything in Basic", "Job alignment AI", "Probability scoring", "LinkedIn job fetcher", "Cover letter generation", "Application tracking"],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: "$39.99/mo",
    features: ["Everything in Pro", "Auto-apply (10 jobs/mo)", "HR/CEO contact finder", "Auto-messaging (10/mo)", "Priority Claude AI", "Full automation suite"],
  },
};

export function UpgradeModal() {
  const { upgradeModalOpen, upgradeModalTier, closeUpgradeModal } = useUIStore();
  const tierInfo = TIER_FEATURES[upgradeModalTier ?? "PRO"];

  if (!tierInfo) return null;

  return (
    <Dialog.Root open={upgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl">
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </Dialog.Close>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upgrade to {tierInfo.name}</h2>
              <p className="text-sm text-gray-500">Starting at {tierInfo.price}</p>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {tierInfo.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <Link href="/pricing" onClick={closeUpgradeModal}>
            <Button variant="gradient" size="lg" className="w-full">
              View Pricing & Upgrade
            </Button>
          </Link>
          <p className="mt-3 text-center text-xs text-gray-400">Cancel anytime. No lock-in.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
