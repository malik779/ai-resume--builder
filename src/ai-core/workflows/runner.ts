import type { ActionRegistry } from "../actions/registry";
import type { ActionContext } from "../actions/types";
import type { EventBus } from "../events/bus";
import type { WorkflowDefinition, WorkflowState } from "./types";

export class WorkflowRunner {
  constructor(
    private readonly actions: ActionRegistry,
    private readonly events?: EventBus,
  ) {}

  async run(
    def: WorkflowDefinition,
    initial: unknown,
    ctx: ActionContext,
  ): Promise<WorkflowState> {
    const state: WorkflowState = {
      workflowId: def.id,
      status: "running",
      currentStepIndex: 0,
      results: {},
    };

    this.events?.emit({
      type: "workflow.started",
      workflowId: def.id,
      sessionId: ctx.sessionId,
      payload: { initial, steps: def.steps.map((s) => s.id) },
    });

    for (let i = 0; i < def.steps.length; i++) {
      const step = def.steps[i];
      state.currentStepIndex = i;

      if (ctx.signal?.aborted) {
        state.status = "cancelled";
        this.events?.emit({
          type: "workflow.cancelled",
          workflowId: def.id,
          sessionId: ctx.sessionId,
          payload: { atStepId: step.id },
        });
        return state;
      }

      this.events?.emit({
        type: "workflow.step.started",
        workflowId: def.id,
        sessionId: ctx.sessionId,
        payload: { stepId: step.id, actionId: step.actionId, index: i },
      });

      const stepCtx: ActionContext =
        ctx.emit || !this.events
          ? ctx
          : {
              ...ctx,
              emit: (type, payload) =>
                this.events!.emit({
                  type,
                  workflowId: def.id,
                  sessionId: ctx.sessionId,
                  payload,
                }),
            };

      const input = step.resolveInput(state, initial);
      const result = await this.actions.execute(step.actionId, input, stepCtx);

      if (!result.ok) {
        state.status = "failed";
        state.error = result.error;
        this.events?.emit({
          type: "workflow.step.failed",
          workflowId: def.id,
          sessionId: ctx.sessionId,
          payload: { stepId: step.id, error: result.error },
        });
        return state;
      }

      state.results[step.id] = result.output;
      this.events?.emit({
        type: "workflow.step.completed",
        workflowId: def.id,
        sessionId: ctx.sessionId,
        payload: { stepId: step.id, output: result.output },
      });
    }

    state.status = "completed";
    this.events?.emit({
      type: "workflow.completed",
      workflowId: def.id,
      sessionId: ctx.sessionId,
      payload: { results: state.results },
    });
    return state;
  }
}
