import type { ActionId, SessionId } from "../types";

export interface ActionContext {
  sessionId: SessionId;
  userId?: string;
  emit?: (eventType: string, payload?: unknown) => void;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface InputSchema<T> {
  parse(input: unknown): T;
}

export interface ActionDefinition<I, O> {
  id: ActionId;
  description: string;
  inputSchema?: InputSchema<I>;
  execute(input: I, ctx: ActionContext): Promise<O>;
}

export type AnyAction = ActionDefinition<unknown, unknown>;

export type ActionResult<O> =
  | { ok: true; output: O }
  | { ok: false; error: ActionError };

export interface ActionError {
  code: string;
  message: string;
  cause?: unknown;
}
