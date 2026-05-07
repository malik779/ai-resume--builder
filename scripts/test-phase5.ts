/**
 * Phase 5 smoke test.
 *
 *   npx tsx scripts/test-phase5.ts
 *
 * Verifies:
 *  1. NullAIWorkerClient reports unavailable and throws on extract calls
 *     (env-not-configured path).
 *  2. HttpAIWorkerClient against a mock Node http server: /extract/ocr
 *     returns { rawText, confidence, source: "local" }.
 *  3. resumeProviderRouter.route({ minConfidence > 0.7, tier: FREE })
 *     escalates to PRO; tier=ENTERPRISE stays at ENTERPRISE.
 *  4. parseUpload computes a confidence score and the AiUsageRecorder
 *     receives a record with the right tier + actionId.
 *  5. parseUpload's confidence drops when key fields are missing.
 */

import { strict as assert } from "node:assert";
import { createServer, type Server } from "node:http";
import {
  ActionRegistry,
  EventBus,
  sessionId,
  type IGenericProvider,
} from "../src/ai-core";
import {
  ACTION_IDS,
  chooseTier,
  registerResumeActions,
  type ResumeDomainDeps,
  type ResumeProviderRouter,
  type ParseUploadOutput,
  type ParsedResume,
} from "../src/domains/resume";
import {
  HttpAIWorkerClient,
  NullAIWorkerClient,
  WorkerUnavailableError,
  type AIWorkerClient,
} from "../src/domains/resume/server/ai-worker-client";
import type {
  AiUsageRecorder,
  RecordAiUsageInput,
} from "../src/domains/resume/server/telemetry";
import type { ResumeRepository } from "../src/lib/db/repositories/resume.repository";
import type { PrismaClient } from "@prisma/client";

// ── 1. NullAIWorkerClient ────────────────────────────────────────────────────

async function testNullClient() {
  const client: AIWorkerClient = new NullAIWorkerClient();
  assert.equal(await client.available(), false);
  await assert.rejects(
    () =>
      client.extractOcr({
        filename: "x.png",
        mimeType: "image/png",
        buffer: new ArrayBuffer(0),
      }),
    (err) => err instanceof WorkerUnavailableError && err.code === "WORKER_NOT_CONFIGURED",
  );
  console.log("✓ NullAIWorkerClient reports unavailable + throws WORKER_NOT_CONFIGURED");
}

// ── 2. HttpAIWorkerClient against a Node mock ────────────────────────────────

function startMockWorker(handler: (path: string) => { status: number; body: object }): Promise<{ url: string; close: () => Promise<void>; server: Server }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const path = (req.url ?? "").split("?")[0];
      const reply = handler(path);
      res.writeHead(reply.status, { "Content-Type": "application/json" });
      // Drain body to avoid hanging on multipart uploads
      req.on("data", () => {});
      req.on("end", () => res.end(JSON.stringify(reply.body)));
    });
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no address");
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((done) => server.close(() => done())),
        server,
      });
    });
  });
}

async function testHttpClientHappyPath() {
  const mock = await startMockWorker((path) => {
    if (path === "/health") return { status: 200, body: { ok: true } };
    if (path === "/extract/ocr") {
      return {
        status: 200,
        body: { rawText: "Ada Lovelace\nMathematician", confidence: 0.91 },
      };
    }
    return { status: 404, body: { error: "not found" } };
  });

  try {
    const client = new HttpAIWorkerClient(mock.url);
    assert.equal(await client.available(), true);
    const result = await client.extractOcr({
      filename: "resume.png",
      mimeType: "image/png",
      buffer: new TextEncoder().encode("fakebytes").buffer as ArrayBuffer,
    });
    assert.equal(result.source, "local");
    assert(result.rawText.includes("Ada Lovelace"));
    assert.equal(result.confidence, 0.91);
    console.log("✓ HttpAIWorkerClient hits /health + /extract/ocr against mock server");
  } finally {
    await mock.close();
  }
}

async function testHttpClientWorkerDown() {
  // Server that always returns 503
  const mock = await startMockWorker(() => ({ status: 503, body: { error: "down" } }));
  try {
    const client = new HttpAIWorkerClient(mock.url);
    assert.equal(await client.available(), false);
    await assert.rejects(
      () =>
        client.extractOcr({
          filename: "r.png",
          mimeType: "image/png",
          buffer: new ArrayBuffer(8),
        }),
      (err) => err instanceof WorkerUnavailableError,
    );
    console.log("✓ HttpAIWorkerClient reports unavailable when server returns 5xx");
  } finally {
    await mock.close();
  }
}

// ── 3. resumeProviderRouter.route() escalation ───────────────────────────────

async function testRouteEscalation() {
  // chooseTier is a pure decision function — assert routing without
  // instantiating real providers (which need API keys).
  assert.equal(chooseTier({ tier: "FREE", minConfidence: 0.85 }), "PRO",
    "FREE + high minConfidence should escalate to PRO");
  assert.equal(chooseTier({ tier: "BASIC", minConfidence: 0.9 }), "PRO",
    "BASIC + high minConfidence should escalate to PRO");
  assert.equal(chooseTier({ tier: "PRO", minConfidence: 0.99 }), "ENTERPRISE",
    "PRO + high minConfidence should escalate to ENTERPRISE");
  assert.equal(chooseTier({ tier: "ENTERPRISE", minConfidence: 0.99 }), "ENTERPRISE",
    "ENTERPRISE should not escalate further");
  assert.equal(chooseTier({ tier: "FREE" }), "FREE",
    "no minConfidence should keep tier as-is");
  assert.equal(chooseTier({ tier: "FREE", minConfidence: 0.5 }), "FREE",
    "minConfidence below threshold should not escalate");
  console.log("✓ chooseTier escalates exactly when minConfidence > 0.7 and tier is weak");
}

// ── 4. parseUpload telemetry + confidence ────────────────────────────────────

const RICH_PARSED: ParsedResume = {
  personalInfo: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    headline: "Mathematician",
  },
  summary: "First computer programmer with a long, detailed achievement story.",
  experiences: [
    {
      company: "Analytical Engine Project",
      title: "Lead Programmer",
      startDate: "1843",
      current: false,
      bullets: ["Wrote first algorithm intended for a machine"],
    },
  ],
  educations: [
    {
      institution: "Self-taught",
      degree: "Independent study",
      startDate: "1830",
      current: false,
    },
  ],
  skills: [{ name: "Bernoulli numbers" }],
  certifications: [],
  languages: [],
};

const SPARSE_PARSED: ParsedResume = {
  personalInfo: { firstName: "X", lastName: "" },
  summary: "",
  experiences: [],
  educations: [],
  skills: [],
  certifications: [],
  languages: [],
};

function fakeProvider(json: unknown): IGenericProvider {
  return {
    modelId: "fake-haiku",
    tier: "premium",
    async complete() {
      return {
        output: JSON.stringify(json),
        meta: { modelId: "fake-haiku", promptTokens: 100, outputTokens: 200, durationMs: 5, costUsd: 0.0001 },
      };
    },
    async completeJSON<T>() {
      return {
        output: json as T,
        meta: { modelId: "fake-haiku", promptTokens: 100, outputTokens: 200, durationMs: 5, costUsd: 0.0001 },
      };
    },
  };
}

class CapturingRecorder implements AiUsageRecorder {
  records: RecordAiUsageInput[] = [];
  async record(input: RecordAiUsageInput) {
    this.records.push(input);
  }
}

async function testParseUploadConfidenceAndTelemetry() {
  const events = new EventBus();
  events.on("*", () => {});
  const registry = new ActionRegistry();
  const recorder = new CapturingRecorder();
  const fakeRouter: ResumeProviderRouter = {
    forTier: () => fakeProvider(RICH_PARSED),
    route: (hints) => fakeProvider(RICH_PARSED),
  };
  const deps: ResumeDomainDeps = {
    resumes: {} as unknown as ResumeRepository,
    db: {} as unknown as PrismaClient,
    listActiveTemplates: async () => [],
    router: fakeRouter,
    aiUsage: recorder,
  };
  registerResumeActions(registry, deps);

  const richResult = await registry.execute<unknown, ParseUploadOutput>(
    ACTION_IDS.PARSE_UPLOAD,
    { rawText: "Ada Lovelace\n" + "x".repeat(80) },
    {
      sessionId: sessionId("phase5-confidence"),
      userId: "u-ada",
      metadata: { tier: "PRO" },
    },
  );
  assert(richResult.ok);
  assert(richResult.output.confidence >= 0.8, `expected high confidence, got ${richResult.output.confidence}`);

  // Telemetry recorded with the right tier + actionId
  assert.equal(recorder.records.length, 1, "exactly one usage row should be recorded");
  const r = recorder.records[0];
  assert.equal(r.userId, "u-ada");
  assert.equal(r.actionId, "resume.parseUpload");
  assert.equal(r.tier, "PRO");
  assert.equal(r.model, "fake-haiku");
  assert.equal(r.success, true);
  assert(r.promptTokens > 0);
  console.log("✓ parseUpload computes confidence and records AI usage with tier/actionId");

  // Sparse parse → low confidence
  const sparseRouter: ResumeProviderRouter = {
    forTier: () => fakeProvider(SPARSE_PARSED),
    route: () => fakeProvider(SPARSE_PARSED),
  };
  const sparseRecorder = new CapturingRecorder();
  const sparseRegistry = new ActionRegistry();
  registerResumeActions(sparseRegistry, {
    ...deps,
    router: sparseRouter,
    aiUsage: sparseRecorder,
  });
  const sparseResult = await sparseRegistry.execute<unknown, ParseUploadOutput>(
    ACTION_IDS.PARSE_UPLOAD,
    { rawText: "Sparse\n" + "x".repeat(80) },
    {
      sessionId: sessionId("phase5-sparse"),
      userId: "u-x",
      metadata: { tier: "FREE" },
    },
  );
  assert(sparseResult.ok);
  assert(
    sparseResult.output.confidence < 0.4,
    `expected low confidence on sparse parse, got ${sparseResult.output.confidence}`,
  );
  console.log("✓ parseUpload confidence drops on sparse parse");
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  await testNullClient();
  await testHttpClientHappyPath();
  await testHttpClientWorkerDown();
  await testRouteEscalation();
  await testParseUploadConfidenceAndTelemetry();
  console.log("\nPhase 5 smoke test PASSED");
}

main().catch((err) => {
  console.error("Phase 5 smoke test FAILED");
  console.error(err);
  process.exit(1);
});
