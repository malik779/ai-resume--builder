import type { ActionId, WorkflowId } from "../types";
import type { ActionError } from "../actions/types";

export interface WorkflowStep {
  id: string;
  actionId: ActionId;
  resolveInput: (state: WorkflowState, initial: unknown) => unknown;
}

export interface WorkflowDefinition {
  id: WorkflowId;
  description: string;
  steps: WorkflowStep[];
}

export type WorkflowStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkflowState {
  workflowId: WorkflowId;
  status: WorkflowStatus;
  currentStepIndex: number;
  results: Record<string, unknown>;
  error?: ActionError;
}
