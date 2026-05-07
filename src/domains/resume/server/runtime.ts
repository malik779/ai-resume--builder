import "server-only";
import { ActionRegistry, EventBus, Orchestrator } from "@/ai-core";
import { db, resumeRepository } from "@/lib/db";
import { getActiveTemplates } from "@/lib/template-service";
import {
  registerResumeActions,
  registerResumeWorkflows,
  type ResumeDomainDeps,
} from "../registry";
import { resumeProviderRouter } from "../services/ai-provider";
import { aiUsageRecorder } from "./telemetry";

let _deps: ResumeDomainDeps | null = null;
let _registry: ActionRegistry | null = null;
let _events: EventBus | null = null;
let _orchestrator: Orchestrator | null = null;

function getDeps(): ResumeDomainDeps {
  if (!_deps) {
    _deps = {
      resumes: resumeRepository,
      db,
      listActiveTemplates: getActiveTemplates,
      router: resumeProviderRouter,
      aiUsage: aiUsageRecorder,
    };
  }
  return _deps;
}

export function getResumeActionRegistry(): ActionRegistry {
  if (!_registry) {
    _registry = new ActionRegistry();
    registerResumeActions(_registry, getDeps());
  }
  return _registry;
}

export function getResumeEventBus(): EventBus {
  if (!_events) _events = new EventBus();
  return _events;
}

export function getResumeOrchestrator(): Orchestrator {
  if (!_orchestrator) {
    _orchestrator = new Orchestrator(
      getResumeActionRegistry(),
      getResumeEventBus(),
    );
    registerResumeWorkflows(_orchestrator);
  }
  return _orchestrator;
}
