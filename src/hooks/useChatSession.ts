"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: unknown;
  createdAt?: string | Date;
}

export interface WorkflowStepState {
  stepIndex: number;
  actionId: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: unknown;
  error?: { code: string; message: string };
}

export interface ChatSessionState {
  status: "idle" | "planning" | "executing" | "done" | "error";
  steps: WorkflowStepState[];
  lastEventType: string | null;
  lastError: string | null;
}

interface ServerEvent {
  type: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
}

const initialState: ChatSessionState = {
  status: "idle",
  steps: [],
  lastEventType: null,
  lastError: null,
};

function genSessionId(): string {
  // Browser-safe UUID; falls back to a random base36 string if crypto.randomUUID
  // is unavailable.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface UseChatSessionOptions {
  resumeId?: string;
  initialSessionId?: string;
}

export function useChatSession(opts: UseChatSessionOptions = {}) {
  const [sessionId] = useState<string>(
    () => opts.initialSessionId ?? genSessionId(),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatSessionState>(initialState);
  const [sending, setSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Open SSE on mount; close on unmount.
  useEffect(() => {
    const url = `/api/chat/${sessionId}/events`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (msg) => {
      let event: ServerEvent;
      try {
        event = JSON.parse(msg.data) as ServerEvent;
      } catch {
        return;
      }

      setState((prev) => {
        const next: ChatSessionState = { ...prev, lastEventType: event.type };

        switch (event.type) {
          case "stream.ready":
            return next;

          case "conversation.planning.started":
            return { ...next, status: "planning", steps: [], lastError: null };

          case "conversation.planning.completed":
            return { ...next, status: prev.status === "planning" ? "executing" : prev.status };

          case "conversation.plan.started": {
            const ids = (event.payload?.actionIds as string[] | undefined) ?? [];
            const stepCount = ids.length;
            return {
              ...next,
              status: stepCount > 0 ? "executing" : "done",
              steps: ids.map((actionId, stepIndex) => ({
                stepIndex,
                actionId,
                status: "pending",
              })),
            };
          }

          case "conversation.step.started": {
            const stepIndex = event.payload?.stepIndex as number | undefined;
            return {
              ...next,
              status: "executing",
              steps: prev.steps.map((s) =>
                s.stepIndex === stepIndex ? { ...s, status: "running" } : s,
              ),
            };
          }

          case "conversation.step.completed": {
            const stepIndex = event.payload?.stepIndex as number | undefined;
            const output = event.payload?.output;
            return {
              ...next,
              steps: prev.steps.map((s) =>
                s.stepIndex === stepIndex
                  ? { ...s, status: "completed", output }
                  : s,
              ),
            };
          }

          case "conversation.step.failed": {
            const stepIndex = event.payload?.stepIndex as number | undefined;
            const error = event.payload?.error as
              | { code: string; message: string }
              | undefined;
            return {
              ...next,
              steps: prev.steps.map((s) =>
                s.stepIndex === stepIndex
                  ? { ...s, status: "failed", error }
                  : s,
              ),
              lastError: error?.message ?? "Step failed",
            };
          }

          case "conversation.plan.completed":
            return { ...next, status: "done" };

          case "conversation.plan.failed":
            return { ...next, status: "error" };

          default:
            return next;
        }
      });
    };

    es.onerror = () => {
      // EventSource auto-reconnects; just record the last seen state.
      setState((prev) => ({ ...prev, lastEventType: "stream.error" }));
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [sessionId]);

  // Load any pre-existing messages when the component mounts.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chat/${sessionId}/messages`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body?.success || !body.data?.messages) return;
        setMessages(body.data.messages as ChatMessage[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const send = useCallback(
    async (message: string) => {
      if (!message.trim() || sending) return;
      setSending(true);

      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date(),
      };
      setMessages((m) => [...m, userMsg]);
      setState((s) => ({ ...s, status: "planning", steps: [], lastError: null }));

      try {
        const res = await fetch(`/api/chat/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message, resumeId: opts.resumeId }),
        });
        const body = await res.json();
        if (!res.ok || !body.success) {
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = body.data as {
          reply: string;
          plan: unknown[];
          steps: unknown[];
        };
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          createdAt: new Date(),
        };
        setMessages((m) => [...m, assistantMsg]);
      } catch (e) {
        setState((s) => ({
          ...s,
          status: "error",
          lastError: e instanceof Error ? e.message : "Request failed",
        }));
      } finally {
        setSending(false);
      }
    },
    [sessionId, opts.resumeId, sending],
  );

  return useMemo(
    () => ({ sessionId, messages, state, sending, send }),
    [sessionId, messages, state, sending, send],
  );
}
