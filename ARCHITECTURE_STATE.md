# Architecture State — End of Phase 5 (Lean)

_Last updated: 2026-05-08_

## Goal of this document

Snapshot of where the AI-first architecture stands. Phase 5 introduces the optional Python worker for local-first OCR, confidence scoring, tier-aware routing, and AI usage telemetry. Image upload is now supported with worker → Claude vision fallback. The Python worker is scaffolded and shipped; it's optional (graceful degradation when unconfigured).

## What's new in Phase 5

### Optional Python AI Worker — `/apps/ai-worker/`

Scaffolded, not run from this sandbox. The user runs it via Docker or `uvicorn`.

| File | Role |
|---|---|
| `main.py` | FastAPI app: `/health`, `/extract/ocr` (Tesseract — fully wired), `/extract/layout` (heuristic stub for Phase 5; Phase 6 fills in real OpenCV layout detection). Per-token confidence averaging on OCR. |
| `requirements.txt` | fastapi, uvicorn, pytesseract, Pillow, opencv-python-headless, numpy |
| `Dockerfile` | python:3.11-slim + tesseract-ocr-eng + libgl. Healthcheck via `/health`. |
| `.dockerignore` | Standard Python ignores. |
| `README.md` | Setup (local + Docker), endpoints, env (`AI_WORKER_URL`), hard rules (returns ONLY structured data; no UI generation). |

Rules locked into the worker:
- Returns ONLY structured data. No HTML, no CSS.
- Stateless. No business logic. No orchestration.
- Failure is visible (4xx/5xx), never silent partial output.

### `AIWorkerClient` — TS contract for the worker

[`src/domains/resume/server/ai-worker-client.ts`](src/domains/resume/server/ai-worker-client.ts):

- `AIWorkerClient` interface — `available()`, `extractOcr(...)`, `extractLayout(...)` (Phase 5 ships only the contract; the layout call works against the heuristic stub).
- `HttpAIWorkerClient` — `fetch`-based with 1.5s health-check, 30s extract timeout, 30s health TTL.
- `NullAIWorkerClient` — used when `AI_WORKER_URL` is unset. Always returns `available() === false` and throws `WORKER_NOT_CONFIGURED`.
- `getAIWorkerClient()` — module-level singleton selecting Http vs Null based on env.
- `setAIWorkerClientForTesting(client)` — test seam.

The base-level `import "server-only"` was deliberately omitted on this file so the smoke test can construct `HttpAIWorkerClient` against a Node http mock without a Next.js context. The runtime singleton (`runtime.ts`) still has `import "server-only"` and that's the load-bearing guard.

### `extractDocument` now handles images — local-first

[`document-extractor.ts`](src/domains/resume/server/document-extractor.ts) gained:
- `SupportedFormat` includes `"image"`.
- Image path: try worker (`local-worker`), fall back to Claude vision (`claude-vision`).
- `ExtractResult` adds `source: "local-worker" | "claude-vision" | "deterministic"` + `confidence: number` so callers can record telemetry distinguishing local vs premium extraction.

DOCX (mammoth) and TXT remain `"deterministic"` with confidence 0.95 / 1.0. PDFs remain Claude vision (Phase 6 may bring `pdf2image` + Tesseract for the local path).

### `ParseUploadOutput.confidence` — quality estimate

[`parse-upload.ts`](src/domains/resume/actions/parse-upload.ts) action now computes a heuristic 0..1 confidence. Required signals (firstName, lastName, email, summary > 20 chars, sections present) always count. Conditional quality signals (well-formed experiences/educations) only count when their prerequisite section exists, so empty arrays don't inflate the score on sparse parses. `resume.parseUpload.completed` event payload includes `confidence`.

### Tier-aware provider routing

[`ai-provider.ts`](src/domains/resume/services/ai-provider.ts) gained:
- `ResumeRouteHints` — `{ tier, preferTier?, minConfidence? }`.
- `chooseTier(hints): SubscriptionTier` — pure decision function, exported for testability without instantiating real providers.
- `ResumeProviderRouter.route(hints)` — optional method on the interface; production router always provides it. Test fakes can omit it (existing Phase 1–4 fakes did).

Escalation rule: when `minConfidence > 0.7` and the user's tier isn't already `ENTERPRISE`, escalate one step (`FREE`/`BASIC` → `PRO`, `PRO` → `ENTERPRISE`). FREE→PRO crosses gpt-4o-mini → Haiku; PRO→ENTERPRISE crosses Haiku → Sonnet.

Phase 5 lean: there is no local LLM provider for text completion. The local-first path is OCR-only (worker → Claude vision). Phase 6+ may wire local Ollama/llama.cpp into a `local` tier of the provider router.

### AI usage telemetry — `AiUsageRecorder`

[`telemetry.ts`](src/domains/resume/server/telemetry.ts):
- `AiUsageRecorder` interface with one method, `record(input)`.
- `aiUsageRecorder` production impl writes to `aiUsageRepository.create(...)` with `metadata: { actionId, tier, source, sessionId, resumeId }`. Failures are swallowed — telemetry never blocks user flow.
- Wired into `ResumeDomainDeps` as optional. `resume.parseUpload` and `resume.summary.generate` actions record after each AI call.

The recorder is optional in the deps so test registries can omit it (existing Phase 1–4 tests did, no changes needed).

### Smoke tests

| Test | Coverage |
|---|---|
| [`scripts/test-phase1.ts`](scripts/test-phase1.ts) | 5 original actions still register; workflow events. ✅ |
| [`scripts/test-phase2.ts`](scripts/test-phase2.ts) | Canonical schema, EngineConfig converter, apply-theme persistence. ✅ |
| [`scripts/test-phase3.ts`](scripts/test-phase3.ts) | Planner + executor + event ordering + failure halt. ✅ |
| [`scripts/test-phase4.ts`](scripts/test-phase4.ts) | parseUpload + autoBuild + parse-and-build workflow. ✅ |
| [`scripts/test-phase5.ts`](scripts/test-phase5.ts) | NullAIWorkerClient unavailable; HttpAIWorkerClient against Node http mock (happy path + 5xx); `chooseTier` escalation logic; parseUpload confidence high on rich + low on sparse; `AiUsageRecorder` captures tier/actionId. ✅ (6 assertions) |

`tsc --noEmit` exits 0.

## Architectural commitments — Phase 5 status

| Commitment | Phase 5 status |
|---|---|
| ai-core stays domain-agnostic | ✅ all worker / telemetry code is in `domains/resume/server` |
| Resume logic stays in `src/domains/resume` | ✅ |
| Generic provider interface | ✅ unchanged |
| Hybrid AI strategy | ✅ image extraction is local-first → premium fallback. Text completion still premium-only (no local LLM yet). |
| Worker returns ONLY structured data | ✅ enforced by API design — `OcrResponse` and `LayoutResponse` are pure data |
| Graceful degradation when worker unavailable | ✅ `NullAIWorkerClient` + try/catch in extractor + 5xx-aware health check |
| Cost telemetry distinguishes tiers | ✅ each AI call records `metadata.tier` |
| AI never mutates UI directly | ✅ unchanged |

## File index — Phase 5 deltas

```
package.json                                       (no new TS deps; mammoth + server-only stay from Phase 4)

apps/ai-worker/                                    NEW — optional Python worker
  main.py                                          FastAPI app
  requirements.txt                                 Python deps
  Dockerfile                                       container
  .dockerignore
  README.md                                        setup + usage

src/domains/resume/
  server/
    ai-worker-client.ts                            new — AIWorkerClient + Http/Null impls
    document-extractor.ts                          updated — image format + worker-first path
    telemetry.ts                                   new — AiUsageRecorder
    runtime.ts                                     updated (+aiUsage in deps)
    index.ts                                       updated (+ai-worker, +telemetry exports)
  services/
    ai-provider.ts                                 updated (+chooseTier, +route(hints))
    index.ts                                       updated
  actions/
    parse-upload.ts                                updated (+confidence, +telemetry record)
    generate-summary.ts                            updated (+telemetry record)
  registry.ts                                      updated (+aiUsage dep wiring)
  index.ts                                         updated (+chooseTier, +ResumeRouteHints)

scripts/test-phase5.ts                             new
```

## What is explicitly NOT done yet

- **Local text-completion LLM.** The "local" tier of the provider router is reserved but unused. `preferTier="local"` collapses to the user's chosen tier today. Phase 6+ can wire Ollama / llama.cpp.
- **PDF via local OCR.** PDFs still go through Claude vision. Once `pdf2image` is in the worker, the same local-first path can apply (`pdf2image → Tesseract`).
- **Real layout detection.** `/extract/layout` returns a heuristic stub. Phase 6 fills in OpenCV-based section detection (this is exactly what the Phase 6 deliverable needs).
- **Worker-confidence gating in workflows.** `parseUpload` reports confidence; nothing yet escalates the workflow to a stronger model when confidence is low. The mechanism (`chooseTier(...)`) exists; wiring it as an extra orchestrator step is a small follow-up.
- **Dashboard "Build with AI" CTA.** Still deferred from Phase 4.5.
- **Decommission `/api/resume/parse`.** Legacy route still ships.
- **Multi-process EventBus** (Phase 3 limitation), **Engine unification** (Phase 2.5) — both still deferred.
