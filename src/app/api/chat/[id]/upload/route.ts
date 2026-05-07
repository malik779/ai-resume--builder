import { NextRequest } from "next/server";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { aiRateLimiter } from "@/lib/redis/client";
import { ok, err, handleRouteError } from "@/lib/utils/api";
import { sessionId as toSessionId } from "@/ai-core";
import {
  extractDocument,
  DocumentExtractionError,
  getResumeEventBus,
  getResumeOrchestrator,
} from "@/domains/resume/server";
import {
  parseAndBuildWorkflow,
  ParseAndBuildInputSchema,
} from "@/domains/resume/workflows";
import { chatRepository } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id: chatSessionId } = await params;
    if (!SESSION_ID_RE.test(chatSessionId)) {
      return err("Invalid chat session id", 400);
    }

    const { success: rateOk } = await aiRateLimiter.limit(userId);
    if (!rateOk) return err("Too many requests. Please slow down.", 429);

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return err("No file uploaded", 400);

    const tier = await getUserTier(userId);
    const sid = toSessionId(chatSessionId);
    const events = getResumeEventBus();

    // Make sure the chat session row exists so subsequent message GETs find
    // tool messages.
    await chatRepository.upsertSession({ id: chatSessionId, userId });
    await chatRepository.appendMessage({
      sessionId: chatSessionId,
      role: "USER",
      content: `Uploaded ${file.name}`,
    });

    // Surface the upload immediately on the SSE stream.
    events.emit({
      type: "conversation.upload.received",
      sessionId: sid,
      payload: { filename: file.name, mimeType: file.type, byteLength: file.size },
    });

    let extracted;
    try {
      extracted = await extractDocument({
        filename: file.name,
        mimeType: file.type,
        buffer: await file.arrayBuffer(),
      });
    } catch (e: unknown) {
      if (e instanceof DocumentExtractionError) {
        events.emit({
          type: "conversation.upload.failed",
          sessionId: sid,
          payload: { code: e.code, message: e.message },
        });
        return err(e.message, 422, e.code);
      }
      throw e;
    }

    events.emit({
      type: "conversation.upload.extracted",
      sessionId: sid,
      payload: {
        format: extracted.format,
        rawTextLength: extracted.rawText.length,
        byteLength: extracted.byteLength,
      },
    });

    // Run via the orchestrator's workflow runner so step 1's parsed JSON
    // flows into step 2's input automatically.
    const orch = getResumeOrchestrator();
    const workflowInput = ParseAndBuildInputSchema.parse({
      userId,
      rawText: extracted.rawText,
      templateId: "classic",
    });

    const state = await orch.runWorkflow(parseAndBuildWorkflow, workflowInput, {
      sessionId: sid,
      userId,
      metadata: { tier },
    });

    if (state.status !== "completed") {
      const errPayload = state.error ?? { code: "WORKFLOW_FAILED", message: "Workflow halted" };
      events.emit({
        type: "conversation.plan.failed",
        sessionId: sid,
        payload: { steps: [] },
      });
      await chatRepository.appendMessage({
        sessionId: chatSessionId,
        role: "TOOL",
        content: `Resume build halted: ${errPayload.message}`,
      });
      return err(errPayload.message, 500, errPayload.code);
    }

    const buildOut = state.results["build"] as {
      resumeId: string;
      sectionsBuilt: string[];
      experienceCount: number;
      educationCount: number;
    };

    await chatRepository.appendMessage({
      sessionId: chatSessionId,
      role: "ASSISTANT",
      content: `I built your resume from ${file.name}. ${buildOut.experienceCount} experience entries, ${buildOut.educationCount} education entries — ready to refine.`,
    });
    await chatRepository.appendMessage({
      sessionId: chatSessionId,
      role: "TOOL",
      content: `Sections: ${buildOut.sectionsBuilt.join(", ")}`,
      toolCalls: { resumeId: buildOut.resumeId } as unknown as object,
    });

    return ok({
      resumeId: buildOut.resumeId,
      sectionsBuilt: buildOut.sectionsBuilt,
      experienceCount: buildOut.experienceCount,
      educationCount: buildOut.educationCount,
      format: extracted.format,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
