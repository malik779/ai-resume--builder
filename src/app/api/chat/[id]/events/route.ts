import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { getResumeEventBus } from "@/domains/resume/server";
import { chatRepository } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;

// Server-Sent Events stream of conversation + workflow events for a chat
// session. The browser opens this once on mount and receives:
//   - conversation.planning.* events
//   - conversation.plan.* events
//   - conversation.step.* events
//   - resume.* events emitted by individual actions (e.g. resume.summary.generated)
//
// Events are filtered by sessionId so each tab/session only sees its own work.
export async function GET(req: NextRequest, { params }: Params) {
  const { id: chatSessionId } = await params;
  if (!SESSION_ID_RE.test(chatSessionId)) {
    return new Response("Invalid chat session id", { status: 400 });
  }

  const session = await requireAuth();
  // Authorize: if a session row exists, it must belong to this user.
  // If no row exists yet (first message hasn't been sent), still allow —
  // the session row will be created on the first POST.
  const existing = await chatRepository.findSession(chatSessionId);
  if (existing && existing.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const bus = getResumeEventBus();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // controller closed
        }
      };

      // Initial hello so the browser confirms the connection is open
      send({ type: "stream.ready", sessionId: chatSessionId, timestamp: Date.now() });

      const unsubscribe = bus.on("*", (event) => {
        if (event.sessionId !== chatSessionId) return;
        send(event);
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // ignore
        }
      }, 25_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
