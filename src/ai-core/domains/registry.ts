import type { ActionRegistry } from "../actions/registry";
import type { IOrchestrator } from "../orchestration/types";
import type { IDomainAdapter } from "./types";

interface DomainEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: IDomainAdapter<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any;
}

/**
 * DomainRegistry — holds all registered domain adapters and boots them against
 * the shared ActionRegistry + IOrchestrator.
 *
 * Usage:
 *   const domains = new DomainRegistry();
 *   domains.add(new ResumeDomainAdapter(), resumeDeps);
 *   // … add more domains here as the platform grows …
 *   domains.bootAll(actionRegistry, orchestrator);
 */
export class DomainRegistry {
  private readonly entries = new Map<string, DomainEntry>();

  add<TDeps>(adapter: IDomainAdapter<TDeps>, deps: TDeps): this {
    const { id } = adapter.meta;
    if (this.entries.has(id)) {
      throw new Error(`Domain already registered: ${id}`);
    }
    this.entries.set(id, { adapter, deps });
    return this;
  }

  get(domainId: string): IDomainAdapter | undefined {
    return this.entries.get(domainId)?.adapter;
  }

  has(domainId: string): boolean {
    return this.entries.has(domainId);
  }

  list(): IDomainAdapter[] {
    return Array.from(this.entries.values()).map((e) => e.adapter);
  }

  bootAll(registry: ActionRegistry, orchestrator: IOrchestrator): void {
    for (const { adapter, deps } of this.entries.values()) {
      adapter.registerActions(registry, deps);
      adapter.registerWorkflows(orchestrator);
    }
  }
}
