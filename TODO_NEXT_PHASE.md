# TODO — Phase 6: AI Template Ingestion

_Goal: generate template configurations from screenshots / design references. AI analyzes an uploaded image and produces a canonical `TemplateConfig` (layout shell + regions + style) that the existing engine renders. AI never emits raw HTML/CSS._

## Carry-overs from Phase 5

- [ ] **Run `npm run db:push`** — same migration as Phase 4 (Resume.theme, ChatSession, ChatMessage). No new schema in Phase 5.
- [ ] **Wire confidence-based escalation in the parse-and-build workflow.** When `parseUpload` returns `confidence < 0.6`, the workflow should re-run with `chooseTier({tier, minConfidence: 0.85})`. The mechanism exists; the workflow wiring is a small additional step.
- [ ] **Dashboard "Build with AI" CTA** (still deferred from Phase 4.5).
- [ ] **Decommission `/api/resume/parse`** once the new chat-driven flow is the user-facing default.

## Phase 6 main work

### 1. Real layout detection in the Python worker

- [ ] Replace the heuristic `/extract/layout` stub with OpenCV-based detection:
  - Detect column structure (single / two-column / sidebar) via vertical projection profiles.
  - Detect section blocks via horizontal projection + connected components.
  - Identify a header region (top ~15% of the page with larger text).
  - Return a structure that maps to canonical `TemplateConfig`: `shell`, `regions: { main, sidebar }`, optional `sidebar.widthPct`, optional rough `style.header` guess.
- [ ] Confidence per region: how clean were the boundaries.

### 2. Style extraction (color + typography hints)

- [ ] In the worker, read dominant accent color from header (k-means on the header band).
- [ ] Heuristic header style: banner-dark / banner-accent / split / stack-* based on layout features.
- [ ] Return `style.header`, `style.section`, and a candidate `mainColor` hex.

### 3. Resume domain action: `template.ingestFromImage`

- [ ] New action `resume.template.ingestFromImage` in `src/domains/resume/actions/template-ingest.ts`.
- [ ] Input: `{ buffer, filename, mimeType }` (image).
- [ ] Calls the worker's `/extract/layout` AND `/extract/ocr` to read both the structure and any visible content.
- [ ] Validates the returned structure against the canonical `TemplateConfigSchema` (`src/domains/resume/templates/types.ts`). Falls back to defaults for missing fields.
- [ ] Output: `{ config: TemplateConfig, ocr: { rawText, confidence }, source: "local-worker" | "claude-vision" }`.

### 4. Premium fallback for layout

- [ ] If the worker is unavailable OR `confidence < 0.5`, fall back to a Claude vision call that's prompted to emit `TemplateConfig` JSON directly.
- [ ] Same router pattern as `extractDocument` in Phase 5.

### 5. Admin "AI quick-add template"

- [ ] Add an "Import from screenshot" button in the admin templates UI (`src/app/admin/templates/new/page.tsx`).
- [ ] On upload, call `template.ingestFromImage` action via a new server action / route.
- [ ] Prefill the admin TemplateForm with the returned `TemplateConfig` — admin reviews, tweaks, and saves.
- [ ] DB row gets `type: "ENGINE"` and `engineConfig` containing the canonical config (or a converter back to legacy `EngineConfig` if the renderer still consumes that — see Phase 2.5 carry-over).

### 6. Smoke test

- [ ] `scripts/test-phase6.ts` — fake worker returns a valid `TemplateConfig`. Assert: action validates output via schema; fallback to "claude-vision" when worker unavailable; admin route returns the prefilled config.

## Out of scope for Phase 6

- Multi-domain extraction architecture — Phase 7.
- Real-time collaborative template authoring.
- Engine unification (Phase 2.5) — still deferred.

## Definition of done for Phase 6

1. An admin user can upload a screenshot of a resume design; the system produces a canonical `TemplateConfig` validated by zod; the admin UI prefills with the result.
2. The flow falls back to Claude vision when the worker is unavailable.
3. AI emits structured config only — no raw HTML/CSS at any step.
4. `tsc --noEmit` clean. All six phase smoke tests pass.
5. `ARCHITECTURE_STATE.md` updated. `TODO_NEXT_PHASE.md` rewritten for Phase 7 (multi-domain AI preparation).
