/**
 * Phase 1 smoke test.
 *
 *   npx tsx scripts/test-phase1.ts
 *
 * Wires the resume domain to fake repository and provider implementations,
 * then runs the regenerate-summary workflow end-to-end and asserts:
 *  - all 5 actions register
 *  - the workflow completes successfully
 *  - events fire in the expected order
 *  - the AI generic adapter is what runs the summary action
 *  - the section update receives the AI output and persists it
 */

import { strict as assert } from "node:assert";
import {
  ActionRegistry,
  EventBus,
  Orchestrator,
  sessionId,
  type AIEvent,
  type ActionContext,
  type IGenericProvider,
} from "../src/ai-core";
import {
  ACTION_IDS,
  WORKFLOW_IDS,
  registerResumeActions,
  registerResumeWorkflows,
  type ResumeDomainDeps,
  type ResumeProviderRouter,
} from "../src/domains/resume";
import type { ResumeRepository } from "../src/lib/db/repositories/resume.repository";

// ── fakes ────────────────────────────────────────────────────────────────────

type FakeResume = {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  summary: string | null;
  personalInfo: Record<string, unknown>;
};

class FakeResumeRepo {
  private store = new Map<string, FakeResume>();
  private nextId = 1;

  async create(data: {
    user: { connect: { id: string } };
    title: string;
    templateId: string;
    personalInfo: Record<string, unknown>;
  }): Promise<FakeResume> {
    const r: FakeResume = {
      id: `r${this.nextId++}`,
      userId: data.user.connect.id,
      title: data.title,
      templateId: data.templateId,
      summary: null,
      personalInfo: data.personalInfo,
    };
    this.store.set(r.id, r);
    return r;
  }

  async findByIdAndUser(id: string, userId: string): Promise<FakeResume | null> {
    const r = this.store.get(id);
    return r && r.userId === userId ? r : null;
  }

  async update(id: string, data: Partial<FakeResume>): Promise<FakeResume> {
    const r = this.store.get(id);
    if (!r) throw new Error("not found");
    Object.assign(r, data);
    return r;
  }
}

const fakeProvider: IGenericProvider = {
  modelId: "fake-model",
  tier: "premium",
  async complete() {
    return {
      output: "{}",
      meta: { modelId: "fake-model", promptTokens: 10, outputTokens: 20, durationMs: 1, costUsd: 0 },
    };
  },
  async completeJSON<T>() {
    const enhance = {
      enhanced_content: "Senior engineer with 8 years building distributed systems.",
      suggested_keywords: ["distributed systems", "scalability"],
      improvements_made: ["Added quantifiable metric"],
      confidence_score: 92,
      placeholder_count: 0,
      readability_score: 88,
      ats_keyword_coverage: 85,
    };
    return {
      output: enhance as unknown as T,
      meta: { modelId: "fake-model", promptTokens: 120, outputTokens: 80, durationMs: 5, costUsd: 0.0001 },
    };
  },
};

const fakeRouter: ResumeProviderRouter = {
  forTier: () => fakeProvider,
};

// ── run ──────────────────────────────────────────────────────────────────────

async function main() {
  const events = new EventBus();
  const log: AIEvent[] = [];
  events.on("*", (e) => {
    log.push(e);
  });

  const registry = new ActionRegistry();
  const repo = new FakeResumeRepo();
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: {} as never,
    listActiveTemplates: async () => [
      {
        id: "t1",
        slug: "classic",
        name: "Classic",
        description: "",
        thumbnail: null,
        previewColor: "#000",
        tags: [],
        minTier: "FREE",
        isActive: true,
        displayOrder: 0,
        type: "HANDCRAFTED" as const,
      },
    ],
    router: fakeRouter,
  };

  registerResumeActions(registry, deps);

  const expectedActions = [
    ACTION_IDS.CREATE_RESUME,
    ACTION_IDS.UPDATE_SECTION,
    ACTION_IDS.SELECT_TEMPLATE,
    ACTION_IDS.APPLY_THEME,
    ACTION_IDS.GENERATE_SUMMARY,
  ];
  for (const id of expectedActions) {
    assert(registry.has(id), `expected action ${id} to be registered`);
  }
  assert(
    registry.list().length >= 5,
    "registry should hold at least the 5 original actions",
  );
  console.log("✓ all 5 original actions registered");

  const orch = new Orchestrator(registry, events);
  registerResumeWorkflows(orch);
  assert(orch.getWorkflow(WORKFLOW_IDS.REGENERATE_SUMMARY), "workflow not registered");
  console.log("✓ regenerate-summary workflow registered");

  // seed a resume to operate on
  const created = await registry.execute(ACTION_IDS.CREATE_RESUME, {
    userId: "u1",
    title: "Test Resume",
    templateId: "classic",
  }, { sessionId: sessionId("s1") } as ActionContext);
  assert(created.ok, "create-resume failed");
  const { resumeId } = created.output as { resumeId: string };
  console.log(`✓ created resume ${resumeId} via action`);

  // run the workflow
  const ctx: ActionContext = {
    sessionId: sessionId("s1"),
    userId: "u1",
    metadata: { tier: "PRO" },
  };
  const result = await orch.runWorkflow(
    WORKFLOW_IDS.REGENERATE_SUMMARY,
    {
      resumeId,
      userId: "u1",
      currentContent: "Engineer.",
      targetRole: "Staff Engineer",
      yearsExperience: 8,
      honestyLevel: "moderate",
    },
    ctx,
  );

  assert.equal(result.status, "completed", `workflow failed: ${JSON.stringify(result.error)}`);
  console.log("✓ workflow completed");

  const generated = result.results["generate"] as { enhancedContent: string; modelId: string };
  assert(generated.enhancedContent.includes("Senior engineer"), "generate step output missing");
  assert.equal(generated.modelId, "fake-model");

  const persisted = result.results["persist"] as { resume: FakeResume };
  assert(persisted.resume.summary?.includes("Senior engineer"), "summary not persisted");
  console.log("✓ summary persisted to fake repo");

  // verify event ordering
  const types = log.map((e) => e.type);
  const expectedSequence = [
    "workflow.started",
    "workflow.step.started",
    "resume.summary.generating",
    "resume.summary.generated",
    "workflow.step.completed",
    "workflow.step.started",
    "resume.section.updated",
    "workflow.step.completed",
    "workflow.completed",
  ];
  for (const expected of expectedSequence) {
    const idx = types.indexOf(expected);
    assert(idx !== -1, `missing event: ${expected} (got: ${types.join(", ")})`);
    types.splice(0, idx + 1);
  }
  console.log("✓ events fired in expected order");

  console.log("\nPhase 1 smoke test PASSED");
}

main().catch((err) => {
  console.error("Phase 1 smoke test FAILED");
  console.error(err);
  process.exit(1);
});
