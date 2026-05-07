import { NextRequest } from "next/server";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { ok, err, handleRouteError } from "@/lib/utils/api";
import { ACTION_IDS, sessionId as sid } from "@/domains/resume";
import { getResumeActionRegistry } from "@/domains/resume/server";
import type { ApplyThemeInput, ApplyThemeOutput } from "@/domains/resume";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = (await req.json()) as Omit<ApplyThemeInput, "resumeId" | "userId">;

    const tier = await getUserTier(session.user.id);
    const registry = getResumeActionRegistry();

    const result = await registry.execute<ApplyThemeInput, ApplyThemeOutput>(
      ACTION_IDS.APPLY_THEME,
      { ...body, resumeId: id, userId: session.user.id },
      {
        sessionId: sid(`http-theme-${id}`),
        userId: session.user.id,
        metadata: { tier },
      },
    );

    if (!result.ok) {
      return err(result.error.message, 400, result.error.code);
    }
    return ok(result.output);
  } catch (e) {
    return handleRouteError(e);
  }
}
