# ai-core

Domain-agnostic AI orchestration foundation. Knows about actions, workflows, providers, events, context, and execution pipelines — not about resumes, templates, or any specific business domain.

## Modules

- `types/` — branded ids, provider tiers, shared cross-cutting types.
- `providers/` — `IGenericProvider` (`complete`, `completeJSON<T>`) and routing contract. No domain methods.
- `actions/` — `ActionDefinition`, `ActionRegistry`, `ActionResult` discriminated union.
- `workflows/` — `WorkflowDefinition`, `WorkflowRunner` for sequential action execution.
- `events/` — `EventBus` with typed and wildcard listeners; orchestration emits step lifecycle events.
- `orchestration/` — `Orchestrator` wires registry + runner + events together.
- `context/` — `ConversationContext`, `MemoryStore` interface, in-memory implementation.

## Rules

1. No imports from `domains/` or any feature folder.
2. No resume-specific types, prompts, or rendering.
3. Providers expose only generic completion primitives. Domain prompts live in their domain folder.
4. Actions are owned by domains; ai-core only provides the registry and execution shape.

## Usage shape (Phase 1+)

```ts
import { ActionRegistry, Orchestrator, EventBus, actionId, workflowId } from "@/ai-core";

const events = new EventBus();
const actions = new ActionRegistry();
actions.register(createResumeAction); // defined in domains/resume

const orch = new Orchestrator(actions, events);
orch.registerWorkflow(buildResumeFromUploadWorkflow);
await orch.runWorkflow(buildResumeFromUploadWorkflow.id, { file }, ctx);
```
