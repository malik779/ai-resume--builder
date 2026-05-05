import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    tierCounts,
    totalResumes,
    aiOpsThisMonth,
    aiCostThisMonth,
    activeSubscriptions,
    templateCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.groupBy({ by: ["tier"], _count: true }),
    prisma.resume.count(),
    prisma.aiUsageLog.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { costUsd: true },
    }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.template.count({ where: { isActive: true } }),
  ]);

  const tiers = Object.fromEntries(tierCounts.map((t) => [t.tier, t._count]));

  return NextResponse.json({
    totalUsers,
    activeSubscriptions,
    tiers,
    totalResumes,
    aiOpsThisMonth,
    aiCostThisMonth: aiCostThisMonth._sum.costUsd ?? 0,
    activeTemplates: templateCount,
  });
}

