import type { ProviderTier } from "../types";

export interface CompleteOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface CompletionMeta {
  modelId: string;
  promptTokens: number;
  outputTokens: number;
  durationMs: number;
  costUsd: number;
}

export interface CompletionResult<T = string> {
  output: T;
  meta: CompletionMeta;
}

export interface IGenericProvider {
  readonly modelId: string;
  readonly tier: ProviderTier;
  complete(prompt: string, opts?: CompleteOptions): Promise<CompletionResult<string>>;
  completeJSON<T>(prompt: string, opts?: CompleteOptions): Promise<CompletionResult<T>>;
}

export interface RoutingHints {
  preferTier?: ProviderTier;
  minConfidence?: number;
  maxCostUsd?: number;
}

export interface IProviderRouter {
  route(hints?: RoutingHints): IGenericProvider;
}
