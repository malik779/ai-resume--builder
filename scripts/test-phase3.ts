/**
 * Phase 3 smoke test.
 *
 *   npx tsx scripts/test-phase3.ts
 *
 * Verifies:
 *  1. The planner accepts a fake provider's JSON output and returns a valid plan
 *     filtered against the allowed action ids.
 *  2. The planner rejects unknown actionIds and tolerates malformed JSON
 *     (falls back to a clarifier reply with empty plan).
 *  3. The executor runs an ActionPlan through the registry tagged with sessionId,
 *     emitting conversation.* events with the right sequence and sessionId.
 *  4. Failed steps halt execution at the first failure and emit
 *     conversation.plan.failed.
 */

import { strict as assert } from "node:assert";
import {
  ActionRegistry,
  EventBus,
  sessionId,
  type AIEvent,
  type IGenericProvider,
} from "../src/ai-core";
import {
  ACTION_IDS,
  executePlan,
  planConversationTurn,
  registerResumeActions,
  type ActionPlanItem,
  type ResumeDomainDeps,
  type ResumeProviderRouter,
} from "../src/domains/resume";
import type { ResumeRepository } from "../src/lib/db/repositories/resume.repository";

// ── Fakes ────────────────────────────────────────────────────────────────────

function makeFakeProvider(jsonOutput: unknown): IGenericProvider {
  return {
    modelId: "fake-planner",
    tier: "premium",
    async complete() {
      return {
        output: JSON.stringify(jsonOutput),
        meta: { modelId: "fake-planner", promptTokens: 50, outputTokens: 30, durationMs: 1, costUsd: 0 },
      };
    },
    async completeJSON<T>() {
      return {
        output: jsonOutput as T,
        meta: { modelId: "fake-planner", promptTokens: 50, outputTokens: 30, durationMs: 1, costUsd: 0 },
      };
    },
  };
}

class FakeRepo {
  store = new Map<string, { id: string; userId: string; templateId: string; theme?: unknown }>();
  seed(r: { id: string; userId: string; templateId: string }) {
    this.store.set(r.id, { ...r });
  }
  async findByIdAndUser(id: string, userId: string) {
    const r = this.store.get(id);
    return r && r.userId === userId ? r : null;
  }
  async update(id: string, data: { templateId?: string; theme?: unknown }) {
    const r = this.store.get(id);
    if (!r) throw new Error("not found");
    if (data.templateId !== undefined) r.templateId = data.templateId;
    if (data.theme !== undefined) r.theme = data.theme;
    return r;
  }
  async create() { throw new Error("not used"); }
}

// ── Test cases ───────────────────────────────────────────────────────────────

async function testPlannerAcceptsValidPlan() {
  const provider = makeFakeProvider({
    reply: "Switching to the classic template.",
    plan: [{ actionId: "resume.template.select", input: { templateId: "classic" } }],
  });

  const result = await planConversationTurn({ provider }, [], "use the classic template");
  assert.equal(result.plan.length, 1);
  assert.equal(result.plan[0].actionId, "resume.template.select");
  assert.equal(result.rejectedItems.length, 0);
  assert(result.reply.includes("classic"));
  console.log("✓ planner produces valid plan from well-formed provider output");
}

async function testPlannerFiltersUnknownActions() {
  const provider = makeFakeProvider({
    reply: "Ok",
    plan: [
      { actionId: "resume.template.select", input: { templateId: "modern" } },
      { actionId: "resume.delete.everything", input: {} },
    ],
  });

  const result = await planConversationTurn({ provider }, [], "ship it");
  assert.equal(result.plan.length, 1, "unknown action should be filtered out");
  assert.equal(result.plan[0].actionId, "resume.template.select");
  assert.equal(result.rejectedItems.length, 1);
  assert.equal(result.rejectedItems[0].actionId, "resume.delete.everything");
  console.log("✓ planner filters out unknown action ids");
}

async function testPlannerHandlesMalformedOutput() {
  const provider = makeFakeProvider({ banana: true }); // not the expected shape
  const result = await planConversationTurn({ provider }, [], "do something");
  assert.equal(result.plan.length, 0);
  assert(result.reply.length > 0, "should fall back to a clarifier reply");
  console.log("✓ planner tolerates malformed provider output");
}

async function testExecutorEmitsTaggedEvents() {
  const events = new EventBus();
  const log: AIEvent[] = [];
  events.on("*", (e) => { log.push(e); });

  const registry = new ActionRegistry();
  const repo = new FakeRepo();
  repo.seed({ id: "r1", userId: "u1", templateId: "classic" });

  const fakeRouter: ResumeProviderRouter = {
    forTier: () => makeFakeProvider({}),
  };

  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: {} as never,
    listActiveTemplates: async () => [{
      id: "t1", slug: "specialist", name: "Specialist", description: "",
      thumbnail: null, previewColor: "#000", tags: [], minTier: "FREE",
      isActive: true, displayOrder: 0, type: "HANDCRAFTED" as const,
    }],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const sid = sessionId("chat-abc");
  const plan: ActionPlanItem[] = [
    { actionId: ACTION_IDS.SELECT_TEMPLATE, input: { resumeId: "r1", userId: "u1", templateId: "specialist" } },
    { actionId: ACTION_IDS.APPLY_THEME, input: { resumeId: "r1", userId: "u1", mainColor: "#FF00AA" } },
  ];

  const result = await executePlan({ registry, events }, plan, {
    sessionId: sid,
    userId: "u1",
    tier: "FREE",
  });

  assert(result.ok, "executor should report success");
  assert.equal(result.steps.length, 2);
  assert(result.steps.every((s) => s.ok));

  // All events should carry the sessionId
  const tagged = log.filter((e) => e.sessionId === sid);
  assert.equal(tagged.length, log.length, "every event should carry the session id");

  const types = log.map((e) => e.type);
  const expected = [
    "conversation.plan.started",
    "conversation.step.started",
    "resume.template.selected",
    "conversation.step.completed",
    "conversation.step.started",
    "resume.theme.applied",
    "conversation.step.completed",
    "conversation.plan.completed",
  ];
  for (const expectedType of expected) {
    const idx = types.indexOf(expectedType);
    assert(idx !== -1, `missing event ${expectedType} (got: ${types.join(", ")})`);
    types.splice(0, idx + 1);
  }
  console.log("✓ executor emits sessionId-tagged conversation events in order");
}

async function testExecutorHaltsOnFailure() {
  const events = new EventBus();
  const log: AIEvent[] = [];
  events.on("*", (e) => { log.push(e); });

  const registry = new ActionRegistry();
  const repo = new FakeRepo();
  // No seeded resume — first action fails on ownership check.

  const fakeRouter: ResumeProviderRouter = {
    forTier: () => makeFakeProvider({}),
  };
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: {} as never,
    listActiveTemplates: async () => [],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const plan: ActionPlanItem[] = [
    { actionId: ACTION_IDS.APPLY_THEME, input: { resumeId: "r-missing", userId: "u1", mainColor: "#000000" } },
    { actionId: ACTION_IDS.SELECT_TEMPLATE, input: { resumeId: "r-missing", userId: "u1", templateId: "classic" } },
  ];

  const result = await executePlan({ registry, events }, plan, {
    sessionId: sessionId("chat-fail"),
    userId: "u1",
    tier: "FREE",
  });

  assert.equal(result.ok, false);
  assert.equal(result.steps.length, 1, "should halt after first failure");
  assert.equal(result.steps[0].ok, false);

  const planFailed = log.find((e) => e.type === "conversation.plan.failed");
  assert(planFailed, "should emit conversation.plan.failed");
  console.log("✓ executor halts after first failure and emits plan.failed");
}

async function main() {
  await testPlannerAcceptsValidPlan();
  await testPlannerFiltersUnknownActions();
  await testPlannerHandlesMalformedOutput();
  await testExecutorEmitsTaggedEvents();
  await testExecutorHaltsOnFailure();
  console.log("\nPhase 3 smoke test PASSED");
}

main().catch((err) => {
  console.error("Phase 3 smoke test FAILED");
  console.error(err);
  process.exit(1);
});
