export interface AIEvent<T = unknown> {
  type: string;
  workflowId?: string;
  sessionId?: string;
  timestamp?: number;
  payload?: T;
}

export type EventListener = (event: AIEvent) => void | Promise<void>;

export type Unsubscribe = () => void;
