"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Settings,
  Users,
  DollarSign,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin/templates", label: "Templates",  icon: Palette },
  { href: "/admin/pricing",   label: "Pricing",    icon: DollarSign },
  { href: "/admin/config",    label: "Config",     icon: Settings },
  { href: "/admin/users",     label: "Users",      icon: Users },
];

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-800">
        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">ResumeAI</p>
          <p className="text-[10px] text-violet-400 font-medium">Superadmin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          {user.image ? (
            <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white">
              {(user.name ?? user.email ?? "A")[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">{user.name ?? "Admin"}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
