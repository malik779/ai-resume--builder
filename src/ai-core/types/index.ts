export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type Confidence = number;

export type ProviderTier = "local" | "premium";

export interface ProviderRoute {
  tier: ProviderTier;
  modelId: string;
  reason?: string;
}

type Brand<T, B extends string> = T & { readonly __brand: B };
export type ActionId = Brand<string, "ActionId">;
export type WorkflowId = Brand<string, "WorkflowId">;
export type SessionId = Brand<string, "SessionId">;

export const actionId = (id: string) => id as ActionId;
export const workflowId = (id: string) => id as WorkflowId;
export const sessionId = (id: string) => id as SessionId;
