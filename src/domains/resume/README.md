# domains/resume

Resume domain implementation. All resume-specific logic — actions, prompts, validation, schema — lives here. The ai-core has no knowledge of this folder; it sees only registered actions and workflows.

## Planned structure (Phase 1+)

```
domains/resume/
  actions/         <- createResume, updateSection, selectTemplate, applyTheme, generateSummary
  workflows/       <- buildResumeFromUpload, conversationalCreate
  prompts/         <- enhance, align, score, contacts, job-eval (moves from src/lib/ai/prompts)
  schemas/         <- zod schemas for inputs/outputs
  services/        <- adapters to existing repositories and template-service
  index.ts
```

## Phase 0 status

Empty. Existing resume code (src/lib/ai/*, src/lib/template-service, src/components/resume/*) continues to work as-is. Phase 1 introduces the action layer on top of those existing services without rewriting them.
