import "server-only";
import { ActionRegistry, EventBus, Orchestrator, DomainRegistry } from "@/ai-core";
import { db, resumeRepository } from "@/lib/db";
import { getActiveTemplates } from "@/lib/template-service";
import { type ResumeDomainDeps } from "../registry";
import { ResumeDomainAdapter } from "../adapter";
import { resumeProviderRouter } from "../services/ai-provider";
import { aiUsageRecorder } from "./telemetry";
import { getAIWorkerClient } from "./ai-worker-client";

let _registry: ActionRegistry | null = null;
let _events: EventBus | null = null;
let _orchestrator: Orchestrator | null = null;
let _booted = false;

function getDeps(): ResumeDomainDeps {
  return {
    resumes: resumeRepository,
    db,
    listActiveTemplates: getActiveTemplates,
    router: resumeProviderRouter,
    aiUsage: aiUsageRecorder,
    getWorkerClient: getAIWorkerClient,
  };
}

// Single boot: create singletons then wire them via DomainRegistry.
// Called lazily by every public getter so callers don't need to care about
// initialization order.
function bootIfNeeded(): void {
  if (_booted) return;
  _booted = true;

  _events       ??= new EventBus();
  _registry     ??= new ActionRegistry();
  _orchestrator ??= new Orchestrator(_registry, _events);

  const domains = new DomainRegistry();
  domains.add(new ResumeDomainAdapter(), getDeps());
  domains.bootAll(_registry, _orchestrator);
}

export function getResumeActionRegistry(): ActionRegistry {
  bootIfNeeded();
  return _registry!;
}

export function getResumeEventBus(): EventBus {
  bootIfNeeded();
  return _events!;
}

export function getResumeOrchestrator(): Orchestrator {
  bootIfNeeded();
  return _orchestrator!;
}
