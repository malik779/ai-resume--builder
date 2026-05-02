"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/stores/ui.store";

const TIER_BADGE: Record<string, { label: string; variant: "default" | "pro" | "enterprise" | "secondary" }> = {
  FREE: { label: "Free Trial", variant: "secondary" },
  BASIC: { label: "Basic", variant: "default" },
  PRO: { label: "Pro", variant: "pro" },
  ENTERPRISE: { label: "Enterprise", variant: "enterprise" },
};

export function DashboardHeader() {
  const { data: session } = useSession();
  const { sidebarOpen } = useUIStore();

  const tier = (session?.user as { tier?: string })?.tier ?? "FREE";
  const badge = TIER_BADGE[tier] ?? TIER_BADGE.FREE;
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "U";

  return (
    <header className={cn(
      "fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6 transition-all",
      sidebarOpen ? "left-60" : "left-16"
    )}>
      <div className="flex items-center gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {tier === "FREE" && (
          <Link href="/pricing" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Upgrade →
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full hover:bg-gray-50 p-1 pr-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{session?.user?.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[180px] rounded-lg border bg-white p-1 shadow-lg" align="end" sideOffset={4}>
              <DropdownMenu.Item className="rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <Link href="/settings">Profile Settings</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <Link href="/settings/billing">Billing</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item
                className="rounded-md px-3 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
