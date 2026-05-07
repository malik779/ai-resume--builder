import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";
import { runConversationTurn } from "@/domains/resume/server";
import { chatRepository } from "@/lib/db";

const Body = z.object({
  message: z.string().min(1).max(4000),
  resumeId: z.string().min(1).optional(),
});

type Params = { params: Promise<{ id: string }> };

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id: chatSessionId } = await params;
    if (!SESSION_ID_RE.test(chatSessionId)) {
      return err("Invalid chat session id", 400);
    }

    const userId = session.user.id;
    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests. Please slow down.", 429);

    const { message, resumeId } = Body.parse(await req.json());
    const tier = await getUserTier(userId);

    const result = await runConversationTurn({
      chatSessionId,
      userId,
      resumeId,
      message,
      tier,
      signal: req.signal,
    });

    return ok(result);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id: chatSessionId } = await params;
    if (!SESSION_ID_RE.test(chatSessionId)) {
      return err("Invalid chat session id", 400);
    }

    const sessionRow = await chatRepository.findSessionWithMessages(
      chatSessionId,
      session.user.id,
    );
    if (!sessionRow) return ok({ messages: [] });

    return ok({
      sessionId: sessionRow.id,
      resumeId: sessionRow.resumeId,
      title: sessionRow.title,
      messages: sessionRow.messages.map((m) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
