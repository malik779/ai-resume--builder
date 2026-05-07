import type { ActionId } from "../types";
import type {
  ActionContext,
  ActionDefinition,
  ActionResult,
  AnyAction,
} from "./types";

export class ActionRegistry {
  private readonly actions = new Map<ActionId, AnyAction>();

  register<I, O>(action: ActionDefinition<I, O>): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Action already registered: ${action.id}`);
    }
    this.actions.set(action.id, action as unknown as AnyAction);
  }

  get<I = unknown, O = unknown>(id: ActionId): ActionDefinition<I, O> | undefined {
    return this.actions.get(id) as ActionDefinition<I, O> | undefined;
  }

  has(id: ActionId): boolean {
    return this.actions.has(id);
  }

  list(): AnyAction[] {
    return Array.from(this.actions.values());
  }

  async execute<I, O>(
    id: ActionId,
    input: I,
    ctx: ActionContext,
  ): Promise<ActionResult<O>> {
    const action = this.get<I, O>(id);
    if (!action) {
      return {
        ok: false,
        error: { code: "ACTION_NOT_FOUND", message: `Unknown action: ${id}` },
      };
    }

    try {
      const parsed = action.inputSchema ? action.inputSchema.parse(input) : input;
      const output = await action.execute(parsed, ctx);
      return { ok: true, output };
    } catch (cause) {
      return {
        ok: false,
        error: {
          code: "ACTION_FAILED",
          message: cause instanceof Error ? cause.message : "Unknown error",
          cause,
        },
      };
    }
  }
}
