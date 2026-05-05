"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { cn } from "@/lib/utils/cn";
import { X, Send, Sparkles, Mic, RefreshCw, ThumbsUp, ThumbsDown, Loader2, Check } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  title: string;
  content: string;
  section?: string;
  applied?: boolean;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  suggestions?: Suggestion[];
}

// ─── Suggestion block ──────────────────────────────────────────────────────

function SuggestionBlock({ sug, onApply }: { sug: Suggestion; onApply: () => void }) {
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 space-y-2 shadow-sm">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{sug.title}</p>
      <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">{sug.content}</p>
      {sug.applied ? (
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <Check className="h-3 w-3" /> Applied
        </span>
      ) : (
        <button
          onClick={onApply}
          className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
        >
          Apply suggestion →
        </button>
      )}
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onApplySuggestion,
  onRegenerate,
}: {
  msg: Message;
  onApplySuggestion: (sugId: string) => void;
  onRegenerate: () => void;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
        isUser
          ? "bg-blue-600 text-white rounded-tr-sm"
          : "bg-gray-100 text-gray-800 rounded-tl-sm"
      )}>
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

        {msg.suggestions?.map((sug) => (
          <SuggestionBlock
            key={sug.id}
            sug={sug}
            onApply={() => onApplySuggestion(sug.id)}
          />
        ))}

        {!isUser && msg.id !== "welcome" && (
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-200/70">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Regenerate
            </button>
            <button className="text-gray-400 hover:text-green-600 transition-colors">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface AIWriterPanelProps {
  resumeId: string;
  initialContext?: string;
  onClose: () => void;
}

export function AIWriterPanel({ resumeId, initialContext, onClose }: AIWriterPanelProps) {
  const { resume, updateSummary } = useResumeStore();
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "ai",
    content: "Hi! I'm your AI resume writer. I can improve your bullet points, rewrite your summary, suggest better phrasing, or help you tailor content for a specific role. What would you like to work on?",
  }]);
  const [input, setInput] = useState(initialContext ?? "");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialContext) {
      setInput(initialContext);
      textareaRef.current?.focus();
    }
  }, [initialContext]);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch(`/api/resume/${resumeId}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
          resumeData: resume,
        }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "ai",
        content: data.message || "Here are my suggestions:",
        suggestions: data.suggestions ?? [],
      };
      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [...m, {
        id: `err-${Date.now()}`,
        role: "ai",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, resume, resumeId]);

  const applySuggestion = (sugId: string) => {
    // Find the suggestion and apply it to the appropriate store
    let found: Suggestion | undefined;
    for (const msg of messages) {
      found = msg.suggestions?.find((s) => s.id === sugId);
      if (found) break;
    }
    if (found?.section === "summary" && found.content) {
      updateSummary(found.content);
    }
    // Mark as applied
    setMessages((msgs) =>
      msgs.map((m) => ({
        ...m,
        suggestions: m.suggestions?.map((s) =>
          s.id === sugId ? { ...s, applied: true } : s
        ),
      }))
    );
  };

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setMessages((m) => m.filter((msg) => msg.id !== messages[messages.length - 1]?.id));
      sendMessage(lastUser.content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="font-bold text-sm text-gray-900">✦ AI writer</span>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Haiku</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onApplySuggestion={applySuggestion}
            onRegenerate={regenerate}
          />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-gray-500 animate-spin" />
              <span className="text-xs text-gray-500">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts (show when only welcome msg) */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {[
            "Improve my professional summary",
            "Enhance my bullet points",
            "Add more keywords",
            "Make my resume more ATS friendly",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="text-[11px] border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 px-3 py-3 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask anything… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none text-gray-900 placeholder:text-gray-400 leading-relaxed"
          />
          <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
            <button className="text-gray-300 hover:text-gray-500 transition-colors" title="Voice input (coming soon)">
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
