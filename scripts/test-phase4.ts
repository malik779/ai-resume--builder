/**
 * Phase 4 smoke test.
 *
 *   npx tsx scripts/test-phase4.ts
 *
 * Verifies:
 *  1. parseUpload action validates the AI provider's JSON against ParsedResumeSchema,
 *     applies defaults for missing fields, and returns a fieldsExtracted count.
 *  2. autoBuildFromParse writes a Resume + WorkExperience + Education rows via
 *     fake repo and fake prisma client.
 *  3. The parse-and-build workflow chains step 1 → step 2 through the
 *     ai-core Orchestrator with sessionId tagging.
 *  4. resume.parseUpload + resume.autoBuild.fromParse are NOT in
 *     PLANNABLE_ACTION_IDS — they only run via the upload workflow.
 */

import { strict as assert } from "node:assert";
import {
  ActionRegistry,
  EventBus,
  Orchestrator,
  sessionId,
  type AIEvent,
  type IGenericProvider,
} from "../src/ai-core";
import {
  ACTION_IDS,
  PLANNABLE_ACTION_IDS,
  WORKFLOW_IDS,
  parseAndBuildWorkflow,
  registerResumeActions,
  registerResumeWorkflows,
  type ResumeDomainDeps,
  type ResumeProviderRouter,
  type ParsedResume,
  type ParseUploadOutput,
  type AutoBuildOutput,
} from "../src/domains/resume";
import type { ResumeRepository } from "../src/lib/db/repositories/resume.repository";
import type { PrismaClient } from "@prisma/client";

// ── Fakes ────────────────────────────────────────────────────────────────────

const SAMPLE_PARSED: ParsedResume = {
  personalInfo: {
    firstName: "Ada",
    lastName: "Lovelace",
    headline: "Computational mathematician",
    email: "ada@analytical.engine",
    phone: "+44 20 1234 5678",
    location: "London",
    linkedinUrl: "linkedin.com/in/ada",
  },
  summary: "First computer programmer.",
  experiences: [
    {
      company: "Analytical Engine Project",
      title: "Lead Programmer",
      location: "London",
      startDate: "1843-01",
      endDate: "1843-12",
      current: false,
      bullets: ["Wrote the first algorithm intended for a machine"],
    },
  ],
  educations: [
    {
      institution: "Self-taught",
      degree: "Independent study",
      field: "Mathematics",
      startDate: "1830-01",
      endDate: "1840-01",
      current: false,
    },
  ],
  skills: [{ name: "Bernoulli numbers" }, { name: "Symbolic algebra" }],
  certifications: [],
  languages: [{ name: "English", proficiency: "native" }],
};

function fakeProvider(emit: unknown): IGenericProvider {
  return {
    modelId: "fake-parser",
    tier: "premium",
    async complete() {
      return {
        output: JSON.stringify(emit),
        meta: { modelId: "fake-parser", promptTokens: 200, outputTokens: 300, durationMs: 5, costUsd: 0.0002 },
      };
    },
    async completeJSON<T>() {
      return {
        output: emit as T,
        meta: { modelId: "fake-parser", promptTokens: 200, outputTokens: 300, durationMs: 5, costUsd: 0.0002 },
      };
    },
  };
}

class FakeResumeRepo {
  store = new Map<string, { id: string; userId: string; templateId: string; title: string }>();
  private nextId = 1;
  async create(data: {
    user: { connect: { id: string } };
    title: string;
    templateId: string;
  }) {
    const r = {
      id: `r${this.nextId++}`,
      userId: data.user.connect.id,
      title: data.title,
      templateId: data.templateId,
    };
    this.store.set(r.id, r);
    return r;
  }
}

interface FakeWorkExp {
  resumeId: string;
  company: string;
  title: string;
  bullets: unknown;
  order: number;
}
interface FakeEdu {
  resumeId: string;
  institution: string;
  degree: string;
  order: number;
}

class FakeDb {
  workExperiences: FakeWorkExp[] = [];
  educations: FakeEdu[] = [];
  workExperience = {
    create: async (args: { data: FakeWorkExp }) => {
      this.workExperiences.push(args.data);
      return args.data;
    },
  };
  education = {
    create: async (args: { data: FakeEdu }) => {
      this.educations.push(args.data);
      return args.data;
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function testPlannableSetExcludesUploadActions() {
  const ids = PLANNABLE_ACTION_IDS as readonly string[];
  assert(!ids.includes(ACTION_IDS.PARSE_UPLOAD), "parseUpload should not be plannable from chat");
  assert(!ids.includes(ACTION_IDS.AUTO_BUILD_FROM_PARSE), "autoBuild should not be plannable from chat");
  console.log("✓ parseUpload + autoBuild excluded from planner-callable set");
}

async function testParseUploadValidatesAndCounts() {
  const events = new EventBus();
  const log: AIEvent[] = [];
  events.on("*", (e) => { log.push(e); });
  const registry = new ActionRegistry();
  const repo = new FakeResumeRepo();
  const db = new FakeDb();

  const fakeRouter: ResumeProviderRouter = {
    forTier: () => fakeProvider(SAMPLE_PARSED),
  };
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: db as unknown as PrismaClient,
    listActiveTemplates: async () => [],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const result = await registry.execute<unknown, ParseUploadOutput>(
    ACTION_IDS.PARSE_UPLOAD,
    { rawText: "Ada Lovelace\nComputational mathematician\nWrote first algorithm..." + " ".repeat(60) },
    {
      sessionId: sessionId("upload-test"),
      userId: "u1",
      metadata: { tier: "FREE" },
      emit: (type, payload) => events.emit({ type, payload }),
    },
  );

  assert(result.ok, `parseUpload failed: ${!result.ok ? result.error.message : ""}`);
  assert.equal(result.output.parsed.personalInfo.firstName, "Ada");
  assert(result.output.fieldsExtracted > 5);
  assert.equal(result.output.parsed.experiences.length, 1);
  const startedEvent = log.find((e) => e.type === "resume.parseUpload.started");
  const completedEvent = log.find((e) => e.type === "resume.parseUpload.completed");
  assert(startedEvent && completedEvent, "should emit parseUpload start + complete events");
  console.log("✓ parseUpload validates JSON, applies defaults, counts fields, emits events");
}

async function testParseUploadAppliesSchemaDefaults() {
  const minimal = {
    personalInfo: { firstName: "Bo", lastName: "" },
    // summary, experiences, educations, skills, certifications, languages all missing
  };
  const registry = new ActionRegistry();
  const repo = new FakeResumeRepo();
  const db = new FakeDb();
  const fakeRouter: ResumeProviderRouter = { forTier: () => fakeProvider(minimal) };
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: db as unknown as PrismaClient,
    listActiveTemplates: async () => [],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const result = await registry.execute<unknown, ParseUploadOutput>(
    ACTION_IDS.PARSE_UPLOAD,
    { rawText: "Bo\n" + "x".repeat(60) },
    { sessionId: sessionId("def"), userId: "u1", metadata: { tier: "FREE" } },
  );
  assert(result.ok);
  assert.deepEqual(result.output.parsed.experiences, []);
  assert.deepEqual(result.output.parsed.skills, []);
  console.log("✓ parseUpload defaults missing arrays to empty");
}

async function testAutoBuildWritesAllRows() {
  const registry = new ActionRegistry();
  const repo = new FakeResumeRepo();
  const db = new FakeDb();
  const fakeRouter: ResumeProviderRouter = { forTier: () => fakeProvider({}) };
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: db as unknown as PrismaClient,
    listActiveTemplates: async () => [],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const result = await registry.execute<unknown, AutoBuildOutput>(
    ACTION_IDS.AUTO_BUILD_FROM_PARSE,
    { userId: "u-ada", parsed: SAMPLE_PARSED, templateId: "classic" },
    { sessionId: sessionId("build"), userId: "u-ada", metadata: { tier: "FREE" } },
  );
  assert(result.ok);
  assert(result.output.resumeId);
  assert.equal(result.output.experienceCount, 1);
  assert.equal(result.output.educationCount, 1);
  assert(result.output.sectionsBuilt.includes("personalInfo"));
  assert(result.output.sectionsBuilt.includes("experiences"));
  assert(result.output.sectionsBuilt.includes("languages"));
  assert.equal(db.workExperiences.length, 1);
  assert.equal(db.workExperiences[0].company, "Analytical Engine Project");
  assert.equal(db.educations.length, 1);
  assert.equal(repo.store.size, 1);
  console.log("✓ autoBuildFromParse writes Resume + WorkExperience + Education rows");
}

async function testParseAndBuildWorkflow() {
  const events = new EventBus();
  const log: AIEvent[] = [];
  events.on("*", (e) => { log.push(e); });
  const registry = new ActionRegistry();
  const repo = new FakeResumeRepo();
  const db = new FakeDb();

  const fakeRouter: ResumeProviderRouter = { forTier: () => fakeProvider(SAMPLE_PARSED) };
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: db as unknown as PrismaClient,
    listActiveTemplates: async () => [],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const orch = new Orchestrator(registry, events);
  registerResumeWorkflows(orch);
  assert(orch.getWorkflow(WORKFLOW_IDS.PARSE_AND_BUILD), "workflow should be registered");

  const sid = sessionId("upload-flow");
  const state = await orch.runWorkflow(parseAndBuildWorkflow, {
    userId: "u-ada",
    rawText: "Ada Lovelace\nComputational mathematician\n" + "x".repeat(80),
    templateId: "classic",
  }, {
    sessionId: sid,
    userId: "u-ada",
    metadata: { tier: "FREE" },
  });

  assert.equal(state.status, "completed", `workflow failed: ${state.error?.message ?? ""}`);
  const buildOut = state.results["build"] as AutoBuildOutput;
  assert(buildOut.resumeId, "should produce resumeId");
  assert.equal(buildOut.experienceCount, 1);

  // All emitted events should carry the same sessionId
  for (const e of log) {
    assert.equal(e.sessionId, sid, `event ${e.type} missing sessionId`);
  }
  // Workflow lifecycle events present
  const types = log.map((e) => e.type);
  for (const expected of [
    "workflow.started",
    "workflow.step.started",
    "resume.parseUpload.started",
    "resume.parseUpload.completed",
    "workflow.step.completed",
    "workflow.step.started",
    "resume.autoBuild.started",
    "resume.autoBuild.completed",
    "workflow.step.completed",
    "workflow.completed",
  ]) {
    assert(types.includes(expected), `expected event ${expected} (got: ${types.join(", ")})`);
  }
  console.log("✓ parse-and-build workflow runs end-to-end with sessionId-tagged events");
}

async function main() {
  await testPlannableSetExcludesUploadActions();
  await testParseUploadValidatesAndCounts();
  await testParseUploadAppliesSchemaDefaults();
  await testAutoBuildWritesAllRows();
  await testParseAndBuildWorkflow();
  console.log("\nPhase 4 smoke test PASSED");
}

main().catch((err) => {
  console.error("Phase 4 smoke test FAILED");
  console.error(err);
  process.exit(1);
});
