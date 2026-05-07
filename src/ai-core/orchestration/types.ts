import type { ActionContext } from "../actions/types";
import type { WorkflowDefinition, WorkflowState } from "../workflows/types";
import type { WorkflowId } from "../types";

export interface IOrchestrator {
  registerWorkflow(def: WorkflowDefinition): void;
  getWorkflow(id: WorkflowId): WorkflowDefinition | undefined;
  runWorkflow(
    def: WorkflowDefinition | WorkflowId,
    initial: unknown,
    ctx: ActionContext,
  ): Promise<WorkflowState>;
}
