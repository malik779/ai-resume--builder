/**
 * Phase 2 smoke test.
 *
 *   npx tsx scripts/test-phase2.ts
 *
 * Verifies:
 *  1. The canonical TemplateConfig schema validates and rejects bad shapes.
 *  2. fromEngineConfig() converts a sample legacy EngineConfig to a valid
 *     TemplateConfig (covering single-column, sidebar-left, and sidebar-right
 *     legacy shapes).
 *  3. The apply-theme action persists merged theme to a fake repo when
 *     resumeId+userId are supplied, and emits the expected event.
 */

import { strict as assert } from "node:assert";
import {
  ActionRegistry,
  EventBus,
  sessionId,
  type ActionContext,
  type AIEvent,
} from "../src/ai-core";
import {
  ACTION_IDS,
  registerResumeActions,
  type ResumeDomainDeps,
  type ApplyThemeOutput,
  type ResumeProviderRouter,
  type ResumeTheme,
} from "../src/domains/resume";
import {
  fromEngineConfig,
  parseTemplateConfig,
  safeParseTemplateConfig,
} from "../src/domains/resume/templates";
import type { ResumeRepository } from "../src/lib/db/repositories/resume.repository";
import type { EngineConfig } from "../src/components/resume/templates/engine";

// ── 1. Canonical schema validation ───────────────────────────────────────────

const goodConfig = {
  shell: "sidebar-left",
  regions: {
    main: ["summary", "experience", "education"],
    sidebar: ["contact", "skills", "certifications"],
  },
  style: { header: "banner-dark", section: "underline" },
  sidebar: { widthPct: 30, bg: "dark-navy" },
};
parseTemplateConfig(goodConfig);
console.log("✓ canonical schema accepts a valid sidebar-left config");

const sidebarMissingSidebar = safeParseTemplateConfig({
  ...goodConfig,
  sidebar: undefined,
});
assert(!sidebarMissingSidebar.success, "schema should reject sidebar shell with no sidebar config");
console.log("✓ canonical schema rejects sidebar shell missing sidebar config");

const badShell = safeParseTemplateConfig({
  ...goodConfig,
  shell: "single", // not in the canonical enum
});
assert(!badShell.success, "schema should reject 'single' (canonical uses 'single-column')");
console.log("✓ canonical schema rejects legacy shell name 'single'");

// ── 2. EngineConfig → TemplateConfig converter ───────────────────────────────

const legacySingle: EngineConfig = {
  header: "banner-dark",
  section: "underline",
};
const conv1 = fromEngineConfig(legacySingle);
assert.equal(conv1.shell, "single-column");
assert.deepEqual(conv1.regions.main, [
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
]);
assert.equal(conv1.regions.sidebar, undefined);
console.log("✓ fromEngineConfig converts legacy single layout");

const legacySidebar: EngineConfig = {
  header: "stack-left",
  section: "left-bar",
  layout: { side: "left", width: "30%", bg: "dark-navy" },
};
const conv2 = fromEngineConfig(legacySidebar);
assert.equal(conv2.shell, "sidebar-left");
assert(conv2.sidebar);
assert.equal(conv2.sidebar?.widthPct, 30);
assert.equal(conv2.sidebar?.bg, "dark-navy");
assert(conv2.regions.sidebar && conv2.regions.sidebar.length > 0);
console.log("✓ fromEngineConfig converts legacy sidebar-left layout");

const legacySidebarRight: EngineConfig = {
  header: "split",
  section: "badge",
  layout: { side: "right", width: "28%", bg: "light-gray" },
};
const conv3 = fromEngineConfig(legacySidebarRight);
assert.equal(conv3.shell, "sidebar-right");
assert.equal(conv3.sidebar?.bg, "light-gray");
console.log("✓ fromEngineConfig converts legacy sidebar-right layout");

// ── 3. apply-theme persists when resumeId+userId provided ────────────────────

interface FakeResume {
  id: string;
  userId: string;
  theme: ResumeTheme | null;
}

class FakeResumeRepo {
  private store = new Map<string, FakeResume>();
  seed(r: FakeResume) {
    this.store.set(r.id, r);
  }
  async findByIdAndUser(id: string, userId: string): Promise<FakeResume | null> {
    const r = this.store.get(id);
    return r && r.userId === userId ? r : null;
  }
  async update(id: string, data: { theme?: unknown }): Promise<FakeResume> {
    const r = this.store.get(id);
    if (!r) throw new Error("not found");
    if (data.theme !== undefined) r.theme = data.theme as ResumeTheme;
    return r;
  }
  async create() { throw new Error("not used"); }
}

async function main() {
  const events = new EventBus();
  const log: AIEvent[] = [];
  events.on("*", (e) => { log.push(e); });

  const registry = new ActionRegistry();
  const repo = new FakeResumeRepo();
  repo.seed({
    id: "r1",
    userId: "u1",
    theme: { mainColor: "#000000", text: { primaryFont: "Arial" }, layout: {} },
  });

  const fakeRouter: ResumeProviderRouter = {
    forTier: () => ({
      modelId: "fake",
      tier: "premium",
      async complete() {
        return {
          output: "",
          meta: { modelId: "fake", promptTokens: 0, outputTokens: 0, durationMs: 0, costUsd: 0 },
        };
      },
      async completeJSON<T>() {
        return {
          output: {} as T,
          meta: { modelId: "fake", promptTokens: 0, outputTokens: 0, durationMs: 0, costUsd: 0 },
        };
      },
    }),
  };
  const deps: ResumeDomainDeps = {
    resumes: repo as unknown as ResumeRepository,
    db: {} as never,
    listActiveTemplates: async () => [],
    router: fakeRouter,
  };
  registerResumeActions(registry, deps);

  const ctx: ActionContext = {
    sessionId: sessionId("s1"),
    userId: "u1",
    emit: (type, payload) => events.emit({ type, payload }),
  };

  // partial theme update — should merge with existing
  const result = await registry.execute<unknown, ApplyThemeOutput>(
    ACTION_IDS.APPLY_THEME,
    {
      resumeId: "r1",
      userId: "u1",
      mainColor: "#4A6CF7",
      text: { lineHeight: 120 },
    },
    ctx,
  );

  assert(result.ok, `apply-theme failed: ${!result.ok ? result.error.message : ""}`);
  const out = result.output;
  assert.equal(out.persisted, true, "should be persisted");
  assert.equal(out.theme.mainColor, "#4A6CF7");
  assert.equal(out.theme.text.primaryFont, "Arial", "existing primaryFont should be preserved by merge");
  assert.equal(out.theme.text.lineHeight, 120, "new lineHeight should be merged in");

  const after = await repo.findByIdAndUser("r1", "u1");
  assert(after?.theme?.mainColor === "#4A6CF7", "DB row should reflect new color");

  const themeEvent = log.find((e) => e.type === "resume.theme.applied");
  assert(themeEvent, "resume.theme.applied event should have been emitted");
  console.log("✓ apply-theme merges + persists theme to repo, emits event");

  // ownership guard: wrong user should fail
  const denied = await registry.execute<unknown, ApplyThemeOutput>(
    ACTION_IDS.APPLY_THEME,
    {
      resumeId: "r1",
      userId: "u2",
      mainColor: "#FF0000",
    },
    ctx,
  );
  assert(!denied.ok, "ownership check should reject u2 from updating u1's resume");
  console.log("✓ apply-theme rejects mismatched user");

  // no-persist mode: missing userId should be a refusal (validation)
  const noUser = await registry.execute<unknown, ApplyThemeOutput>(
    ACTION_IDS.APPLY_THEME,
    { resumeId: "r1", mainColor: "#00FF00" },
    ctx,
  );
  assert(!noUser.ok, "should require userId when resumeId provided");
  console.log("✓ apply-theme schema requires userId when resumeId present");

  // no-resume mode: pure validation/normalization
  const stateless = await registry.execute<unknown, ApplyThemeOutput>(
    ACTION_IDS.APPLY_THEME,
    { mainColor: "#123abc" },
    ctx,
  );
  assert(stateless.ok && stateless.output.persisted === false, "stateless apply should not persist");
  console.log("✓ apply-theme works statelessly when no resumeId given");

  console.log("\nPhase 2 smoke test PASSED");
}

main().catch((err) => {
  console.error("Phase 2 smoke test FAILED");
  console.error(err);
  process.exit(1);
});
