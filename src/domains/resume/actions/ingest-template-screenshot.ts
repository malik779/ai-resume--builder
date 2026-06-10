import { z } from "zod";
import type { ActionDefinition } from "@/ai-core";
import { ACTION_IDS } from "../action-ids";
import {
  analyzeTemplateScreenshot,
  type ImageMediaType,
  type WorkerHint,
} from "@/lib/ai/vision";
import type { AIWorkerClient } from "../server/ai-worker-client";
import type { AiUsageRecorder } from "../server/telemetry";

// ── I/O contracts ─────────────────────────────────────────────────────────────

const IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

const IngestTemplateScreenshotInputSchema = z.object({
  /** Base-64 encoded image content. */
  imageBase64: z.string().min(100),
  /** MIME type of the image. */
  mediaType: z.enum(IMAGE_MEDIA_TYPES),
});

export type IngestTemplateScreenshotInput = z.infer<
  typeof IngestTemplateScreenshotInputSchema
>;

export type IngestTemplateSource = "worker" | "haiku" | "sonnet";

export interface IngestTemplateScreenshotOutput {
  shell: "single" | "sidebar-left" | "sidebar-right" | "two-column";
  header: string;
  section: string;
  uppercase: boolean;
  sidebarWidthPct?: number;
  sidebarBg?: string;
  mainSections: string[];
  sidebarSections?: string[];
  confidence: number;
  notes: string[];
  /** Which path ultimately produced the final result. */
  source: IngestTemplateSource;
  /** Total AI cost in USD (0 when the worker handled it locally). */
  costUsd: number;
  /** The model ID that was invoked (or "local" for worker-only results). */
  modelId: string;
}

// ── Deps ──────────────────────────────────────────────────────────────────────

export interface IngestTemplateDeps {
  getWorkerClient: () => AIWorkerClient;
  aiUsage?: AiUsageRecorder;
}

// ── Confidence thresholds ─────────────────────────────────────────────────────

// Worker result is trusted when confidence is at or above this value.
const WORKER_ACCEPT_THRESHOLD = 0.70;

// ── Action ────────────────────────────────────────────────────────────────────

export function createIngestTemplateScreenshotAction(
  deps: IngestTemplateDeps,
): ActionDefinition<IngestTemplateScreenshotInput, IngestTemplateScreenshotOutput> {
  return {
    id: ACTION_IDS.INGEST_TEMPLATE_SCREENSHOT,
    description:
      "Analyse a resume template screenshot and return a structured EngineConfig. " +
      "Routing: Python worker (local OpenCV) → Claude Haiku → Claude Sonnet, " +
      "escalating only when the previous step's confidence is too low.",
    inputSchema: IngestTemplateScreenshotInputSchema,

    async execute(input, ctx) {
      const worker = deps.getWorkerClient();

      // ── Step 1: Try the local Python worker ──────────────────────────────
      let workerHint: WorkerHint | undefined;

      if (await worker.available()) {
        try {
          ctx.emit?.("resume.template.ingest.workerStarted", {});
          const buf = Buffer.from(input.imageBase64, "base64");
          const layoutResult = await worker.extractLayout({
            filename: `template.${input.mediaType.split("/")[1]}`,
            mimeType: input.mediaType,
            buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
          });

          ctx.emit?.("resume.template.ingest.workerDone", {
            confidence: layoutResult.confidence,
            shell: layoutResult.shell,
          });

          // If the worker is confident enough, use its result directly.
          if (layoutResult.confidence >= WORKER_ACCEPT_THRESHOLD) {
            const output: IngestTemplateScreenshotOutput = {
              shell: layoutResult.shell as IngestTemplateScreenshotOutput["shell"],
              header: layoutResult.header ?? "stack-left",
              section: layoutResult.section ?? "underline",
              uppercase: layoutResult.uppercase ?? false,
              sidebarWidthPct: layoutResult.sidebarWidthPct,
              sidebarBg: layoutResult.sidebarBg,
              mainSections: layoutResult.regions.main,
              sidebarSections: layoutResult.regions.sidebar,
              confidence: layoutResult.confidence,
              notes: ["Detected locally by OpenCV — no AI call required."],
              source: "worker",
              costUsd: 0,
              modelId: "local",
            };
            return output;
          }

          // Worker ran but confidence is below threshold — use it as a hint
          // for Claude so it can focus on uncertain fields.
          workerHint = {
            shell: layoutResult.shell,
            header: layoutResult.header,
            section: layoutResult.section,
            uppercase: layoutResult.uppercase,
            sidebarWidthPct: layoutResult.sidebarWidthPct,
            sidebarBg: layoutResult.sidebarBg,
            mainSections: layoutResult.regions.main,
            sidebarSections: layoutResult.regions.sidebar,
          };
        } catch {
          // Worker call failed — proceed with Claude only (no hint)
          ctx.emit?.("resume.template.ingest.workerFailed", {});
        }
      }

      // ── Step 2: Claude Vision (Haiku → Sonnet auto-escalation) ──────────
      ctx.emit?.("resume.template.ingest.visionStarted", { hasWorkerHint: !!workerHint });

      const { result, meta } = await analyzeTemplateScreenshot(
        input.imageBase64,
        input.mediaType as ImageMediaType,
        { hint: workerHint },
      );

      ctx.emit?.("resume.template.ingest.visionDone", {
        modelId: meta.modelId,
        confidence: result.confidence,
        escalated: meta.escalated,
        costUsd: meta.costUsd,
      });

      if (deps.aiUsage && ctx.userId) {
        void deps.aiUsage.record({
          userId: ctx.userId,
          actionId: "resume.template.ingestScreenshot",
          operation: "ENHANCE",
          model: meta.modelId,
          promptTokens: meta.promptTokens,
          outputTokens: meta.outputTokens,
          costUsd: meta.costUsd,
          durationMs: meta.durationMs,
          success: true,
          tier: "ENTERPRISE", // admin action — always at highest tier for billing
          sessionId: ctx.sessionId,
        });
      }

      const source: IngestTemplateSource = meta.escalated ? "sonnet" : "haiku";

      return {
        shell: result.shell,
        header: result.header,
        section: result.section,
        uppercase: result.uppercase,
        sidebarWidthPct: result.sidebarWidthPct,
        sidebarBg: result.sidebarBg,
        mainSections: result.mainSections,
        sidebarSections: result.sidebarSections,
        confidence: result.confidence,
        notes: result.notes,
        source,
        costUsd: meta.costUsd,
        modelId: meta.modelId,
      };
    },
  };
}
