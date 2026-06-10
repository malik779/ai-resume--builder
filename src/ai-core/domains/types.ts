import type { ActionRegistry } from "../actions/registry";
import type { IOrchestrator } from "../orchestration/types";

export interface DomainMeta {
  /** Unique domain identifier (e.g. "resume", "portfolio", "ecommerce") */
  id: string;
  name: string;
  description?: string;
  version?: string;
}

/**
 * IDomainAdapter — the contract every domain must implement to plug into the
 * ai-core orchestration system.
 *
 * A domain provides:
 *   - metadata about itself (id, name, version)
 *   - a method to register its actions into the shared ActionRegistry
 *   - a method to register its workflows into the shared IOrchestrator
 *
 * The ai-core layer stays domain-agnostic: it only calls these two hooks at
 * boot time and never imports domain-specific code directly.
 *
 * @template TDeps  Runtime dependencies the domain needs (e.g. DB repos, AI
 *                  providers). Typed per-domain; unknown here so the registry
 *                  can hold adapters of different types without generics leaking
 *                  into every callsite.
 */
export interface IDomainAdapter<TDeps = unknown> {
  readonly meta: DomainMeta;
  registerActions(registry: ActionRegistry, deps: TDeps): void;
  registerWorkflows(orchestrator: IOrchestrator): void;
}
