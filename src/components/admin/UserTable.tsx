"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Shield, User } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
  subscription: { tier: string; status: string } | null;
  _count: { resumes: number };
};

const TIER_COLORS: Record<string, string> = {
  FREE: "text-gray-400",
  BASIC: "text-blue-400",
  PRO: "text-violet-400",
  ENTERPRISE: "text-amber-400",
};

export function UserTable({ users: initial, total, page, pages, search: initialSearch }: {
  users: UserRow[];
  total: number;
  page: number;
  pages: number;
  search: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [saving, setSaving] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/admin/users?search=${encodeURIComponent(search)}&page=1`);
  };

  const updateUser = async (userId: string, patch: { role?: string; tier?: string }) => {
    setSaving(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    setSaving(null);
    router.refresh();
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 max-w-sm bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
        />
        <button type="submit" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumes</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {initial.map((u) => (
              <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.image ? (
                      <img src={u.image} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                        {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-gray-200 font-medium">{u.name ?? "—"}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={u.subscription?.tier ?? "FREE"}
                    disabled={saving === u.id}
                    onChange={(e) => updateUser(u.id, { tier: e.target.value })}
                    className={cn("bg-transparent text-xs font-semibold focus:outline-none cursor-pointer", TIER_COLORS[u.subscription?.tier ?? "FREE"])}
                  >
                    {["FREE", "BASIC", "PRO", "ENTERPRISE"].map((t) => (
                      <option key={t} value={t} className="bg-gray-900 text-gray-100">{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-400">{u._count.resumes}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("flex items-center gap-1 text-xs font-medium", u.role === "ADMIN" ? "text-violet-400" : "text-gray-500")}>
                    {u.role === "ADMIN" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updateUser(u.id, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}
                    disabled={saving === u.id}
                    className="px-2 py-1 text-[10px] font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded transition-colors disabled:opacity-50"
                  >
                    {u.role === "ADMIN" ? "Remove admin" : "Make admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">{total} users · page {page} of {pages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/users?page=${page - 1}&search=${encodeURIComponent(search)}`}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs">
                ← Prev
              </a>
            )}
            {page < pages && (
              <a href={`/admin/users?page=${page + 1}&search=${encodeURIComponent(search)}`}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs">
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
