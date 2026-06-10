import type { ActionRegistry } from "@/ai-core/actions/registry";
import type { IOrchestrator } from "@/ai-core/orchestration/types";
import type { IDomainAdapter, DomainMeta } from "@/ai-core/domains/types";
import { registerResumeActions, registerResumeWorkflows } from "./registry";
import type { ResumeDomainDeps } from "./registry";

/**
 * ResumeDomainAdapter — plugs the resume domain into the ai-core system via
 * the IDomainAdapter contract.
 *
 * At boot time the DomainRegistry calls registerActions + registerWorkflows.
 * All resume-specific logic stays here; ai-core never imports resume code.
 *
 * Future domains (portfolio, ecommerce, SaaS onboarding) follow the same
 * pattern: implement IDomainAdapter, call domains.add(new XAdapter(), xDeps).
 */
export class ResumeDomainAdapter implements IDomainAdapter<ResumeDomainDeps> {
  readonly meta: DomainMeta = {
    id: "resume",
    name: "Resume Builder",
    description: "AI-powered resume creation, parsing, and optimization",
    version: "1.0.0",
  };

  registerActions(registry: ActionRegistry, deps: ResumeDomainDeps): void {
    registerResumeActions(registry, deps);
  }

  registerWorkflows(orchestrator: IOrchestrator): void {
    registerResumeWorkflows(orchestrator);
  }
}
