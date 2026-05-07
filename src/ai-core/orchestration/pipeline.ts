import type { ActionRegistry } from "../actions/registry";
import type { ActionContext } from "../actions/types";
import type { EventBus } from "../events/bus";
import type { WorkflowId } from "../types";
import type { WorkflowDefinition, WorkflowState } from "../workflows/types";
import { WorkflowRunner } from "../workflows/runner";
import type { IOrchestrator } from "./types";

export class Orchestrator implements IOrchestrator {
  private readonly workflows = new Map<WorkflowId, WorkflowDefinition>();
  private readonly runner: WorkflowRunner;

  constructor(
    private readonly actions: ActionRegistry,
    events?: EventBus,
  ) {
    this.runner = new WorkflowRunner(actions, events);
  }

  registerWorkflow(def: WorkflowDefinition): void {
    if (this.workflows.has(def.id)) {
      throw new Error(`Workflow already registered: ${def.id}`);
    }
    this.workflows.set(def.id, def);
  }

  getWorkflow(id: WorkflowId): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  async runWorkflow(
    def: WorkflowDefinition | WorkflowId,
    initial: unknown,
    ctx: ActionContext,
  ): Promise<WorkflowState> {
    const definition =
      typeof def === "string"
        ? this.workflows.get(def as WorkflowId)
        : def;
    if (!definition) {
      throw new Error(`Workflow not found: ${String(def)}`);
    }
    return this.runner.run(definition, initial, ctx);
  }
}
