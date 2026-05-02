import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateLinkedInFetcher } from "@/lib/features/gate";
import { jobRepository, db } from "@/lib/db";
import { ok, err, handleRouteError } from "@/lib/utils/api";

const CreateSearchSchema = z.object({
  name: z.string().max(100).default("My Job Search"),
  keywords: z.array(z.string()).min(1).max(10),
  locations: z.array(z.string()).max(10).default([]),
  remoteOnly: z.boolean().default(false),
  matchThreshold: z.union([z.literal(50), z.literal(70), z.literal(100)]).default(70),
  companySizes: z.array(z.string()).default([]),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const tier = await getUserTier(userId);

    const gate = gateLinkedInFetcher(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const searches = await db.jobSearch.findMany({
      where: { userId },
      include: { _count: { select: { jobs: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(searches);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const tier = await getUserTier(userId);

    const gate = gateLinkedInFetcher(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const body = CreateSearchSchema.parse(await req.json());

    const search = await db.jobSearch.create({
      data: { userId, ...body },
    });

    return ok(search, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
