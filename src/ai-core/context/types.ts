import type { SessionId } from "../types";

export interface MemoryStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export interface ConversationContext {
  sessionId: SessionId;
  userId?: string;
  memory: MemoryStore;
  metadata: Record<string, unknown>;
}
