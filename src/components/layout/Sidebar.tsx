"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, Briefcase, LayoutDashboard, Settings,
  Zap, Users, MessageSquare, TrendingUp, CreditCard,
  ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/stores/ui.store";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier } from "@prisma/client";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/resume", icon: FileText, label: "My Resumes" },
  { href: "/jobs", icon: Briefcase, label: "Job Board", tier: "PRO" as SubscriptionTier },
  { href: "/applications", icon: TrendingUp, label: "Applications" },
  { href: "/contacts", icon: Users, label: "Contacts", tier: "ENTERPRISE" as SubscriptionTier },
  { href: "/messages", icon: MessageSquare, label: "Outreach", tier: "ENTERPRISE" as SubscriptionTier },
];

interface SidebarProps {
  userTier: SubscriptionTier;
}

export function Sidebar({ userTier }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, openUpgradeModal } = useUIStore();

  const tierOrder: SubscriptionTier[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  const userTierIdx = tierOrder.indexOf(userTier);

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-white transition-all duration-300",
      sidebarOpen ? "w-60" : "w-16"
    )}>
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", sidebarOpen ? "justify-between" : "justify-center")}>
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ResumeAI
            </span>
          </Link>
        )}
        <button onClick={toggleSidebar} className="rounded-md p-1.5 hover:bg-gray-100 text-gray-500">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const requiredTierIdx = item.tier ? tierOrder.indexOf(item.tier) : 0;
          const isLocked = item.tier && userTierIdx < requiredTierIdx;

          return (
            <button
              key={item.href}
              onClick={() => {
                if (isLocked) { openUpgradeModal(item.tier!); return; }
                window.location.href = item.href;
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isLocked && "opacity-60",
                !sidebarOpen && "justify-center"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isLocked && (
                    <Badge variant={item.tier === "ENTERPRISE" ? "enterprise" : "pro"} className="text-[10px] px-1.5 py-0">
                      {item.tier}
                    </Badge>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t px-2 py-4 space-y-1">
        {sidebarOpen && userTier === "FREE" && (
          <div className="mx-1 mb-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">Unlock Pro Features</p>
            <p className="text-xs text-blue-600 mb-2">Job alignment, probability scoring, LinkedIn automation</p>
            <Link href="/pricing" className="block w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-center text-xs font-semibold text-white">
              Upgrade Now
            </Link>
          </div>
        )}
        <Link href="/settings/billing" className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50",
          !sidebarOpen && "justify-center"
        )}>
          <CreditCard className="h-4 w-4" />
          {sidebarOpen && "Billing"}
        </Link>
        <Link href="/settings" className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50",
          !sidebarOpen && "justify-center"
        )}>
          <Settings className="h-4 w-4" />
          {sidebarOpen && "Settings"}
        </Link>
      </div>
    </aside>
  );
}
