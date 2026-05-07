import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { ok, err, handleRouteError } from "@/lib/utils/api";
import { ACTION_IDS, sessionId as sid } from "@/domains/resume";
import { getResumeActionRegistry } from "@/domains/resume/server";
import type { SelectTemplateOutput } from "@/domains/resume";

const Body = z.object({ templateId: z.string().min(1).max(100) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { templateId } = Body.parse(await req.json());

    const tier = await getUserTier(session.user.id);
    const registry = getResumeActionRegistry();

    const result = await registry.execute<
      { resumeId: string; userId: string; templateId: string },
      SelectTemplateOutput
    >(
      ACTION_IDS.SELECT_TEMPLATE,
      { resumeId: id, userId: session.user.id, templateId },
      {
        sessionId: sid(`http-template-${id}`),
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
