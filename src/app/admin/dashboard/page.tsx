import { requireAdmin } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, tierCounts, totalResumes, aiOpsMonth, aiCostMonth, activeTemplates] =
    await Promise.all([
      prisma.user.count(),
      prisma.subscription.groupBy({ by: ["tier"], _count: true }),
      prisma.resume.count(),
      prisma.aiUsageLog.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.aiUsageLog.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { costUsd: true } }),
      prisma.template.count({ where: { isActive: true } }),
    ]);

  const tiers = Object.fromEntries(tierCounts.map((t) => [t.tier, t._count]));
  return { totalUsers, tiers, totalResumes, aiOpsMonth, aiCostMonth: aiCostMonth._sum.costUsd ?? 0, activeTemplates };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const stats = await getStats();

  const cards = [
    { label: "Total Users",       value: stats.totalUsers.toLocaleString(),            sub: `${stats.tiers["FREE"] ?? 0} free · ${stats.tiers["BASIC"] ?? 0} basic · ${stats.tiers["PRO"] ?? 0} pro` },
    { label: "Total Resumes",     value: stats.totalResumes.toLocaleString(),           sub: "across all users" },
    { label: "AI Ops This Month", value: stats.aiOpsMonth.toLocaleString(),             sub: `$${stats.aiCostMonth.toFixed(2)} USD cost` },
    { label: "Active Templates",  value: stats.activeTemplates.toLocaleString(),        sub: "visible in picker" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">System overview</p>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-3xl font-bold text-white mb-1">{c.value}</p>
            <p className="text-xs text-gray-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Subscriptions by Tier</p>
          <div className="space-y-3">
            {(["FREE", "BASIC", "PRO", "ENTERPRISE"] as const).map((tier) => {
              const count = stats.tiers[tier] ?? 0;
              const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
              const colors: Record<string, string> = { FREE: "bg-gray-600", BASIC: "bg-blue-600", PRO: "bg-violet-600", ENTERPRISE: "bg-amber-500" };
              return (
                <div key={tier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{tier}</span>
                    <span className="text-gray-300">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full">
                    <div className={`h-full rounded-full ${colors[tier]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Quick Actions</p>
          <div className="space-y-2">
            {[
              { href: "/admin/templates/new", label: "Create new template" },
              { href: "/admin/pricing",        label: "Manage pricing & discounts" },
              { href: "/admin/config",         label: "Update system config" },
              { href: "/admin/users",          label: "Manage users" },
            ].map((a) => (
              <a key={a.href} href={a.href}
                className="flex items-center justify-between px-4 py-2.5 bg-gray-800 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                {a.label}
                <span className="text-gray-600">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

