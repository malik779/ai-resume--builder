import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = 50;
  const search = req.nextUrl.searchParams.get("search") ?? "";

  const where = search
    ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { name: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        subscription: { select: { tier: true, status: true, billingInterval: true } },
        _count: { select: { resumes: true, aiUsageLogs: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, role, tier } = await req.json() as {
    userId: string;
    role?: "USER" | "ADMIN";
    tier?: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  };

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const updates: Promise<unknown>[] = [];

  if (role) {
    updates.push(prisma.user.update({ where: { id: userId }, data: { role } }));
  }

  if (tier) {
    updates.push(
      prisma.subscription.upsert({
        where: { userId },
        update: { tier },
        create: { userId, tier, status: "ACTIVE" },
      })
    );
  }

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}

