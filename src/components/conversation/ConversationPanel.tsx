"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, Send, Sparkles } from "lucide-react";
import { useChatSession, type ChatMessage } from "@/hooks/useChatSession";
import { useChatActionSync } from "@/hooks/useChatActionSync";
import { useCustomizeStore } from "@/stores/customize.store";
import { WorkflowProgress } from "./WorkflowProgress";
import { AnimatedResumeThumbnail } from "./AnimatedResumeThumbnail";
import { cn } from "@/lib/utils/cn";

interface Props {
  resumeId: string;
}

const SUGGESTIONS = [
  "Switch to the classic template",
  "Make the main color forest green",
  "Rewrite my summary for a senior role",
  "Use US Letter format with center-aligned header",
];

const ACCEPTED = ".pdf,.docx,.doc,.txt,.md";

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const isTool = msg.role === "tool";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && !isTool && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap",
          isUser && "bg-blue-600 text-white rounded-br-sm",
          !isUser && !isTool && "bg-white border border-gray-200 text-gray-800 rounded-bl-sm",
          isTool && "bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs italic max-w-full",
        )}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      className="flex gap-2 justify-start"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-3.5 py-2.5 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function ConversationPanel({ resumeId }: Props) {
  const { sessionId, messages, state, sending, send } = useChatSession({ resumeId });
  useChatActionSync(state);

  const accent = useCustomizeStore((s) => s.mainColor);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = state.status === "planning" || state.status === "executing" || uploading;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, state.steps.length, state.status, uploading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || busy) return;
    void send(input);
    setInput("");
  };

  const handleUploadFile = async (file: File) => {
    if (uploading) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/chat/${sessionId}/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error ?? `Upload failed (HTTP ${res.status})`);
      }
      // Reload chat history so the assistant + tool messages show up.
      const refreshed = await fetch(`/api/chat/${sessionId}/messages`, {
        credentials: "include",
      });
      const refreshedBody = await refreshed.json();
      if (refreshedBody?.success && refreshedBody.data?.messages) {
        // The hook owns messages; we'd need a setter. For now, reload via
        // navigation when the new resumeId arrives — useChatActionSync handles
        // the navigation after the autoBuild step completes.
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUploadFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleUploadFile(file);
  };

  const showThumbnail = busy && (messages.length > 0 || uploading);
  const showSuggestions = messages.length === 0 && !busy;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-gray-50 to-white relative",
        dragOver && "ring-2 ring-blue-400",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-30 bg-blue-50/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-blue-700 font-semibold text-sm">
            Drop your resume to import
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">AI Resume Assistant</div>
            <div className="text-[11px] text-gray-500">
              {uploading
                ? "Reading your file…"
                : busy
                ? "Working on your resume…"
                : "Ready when you are"}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showThumbnail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-b">
              <AnimatedResumeThumbnail active={busy} accent={accent} />
              <p className="text-[11px] text-gray-500 text-center mt-2">
                {uploading ? "Reading your resume…" : "AI is shaping your resume…"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-2.5">
        {showSuggestions && (
          <div className="flex flex-col gap-3 my-auto">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700">
                What should we change?
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Tell me, or upload your existing resume to import.
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-5 text-xs text-gray-600 hover:border-blue-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Upload resume (PDF, DOCX, TXT)
            </button>
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="text-left text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:text-gray-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}

        <AnimatePresence>{busy && <TypingIndicator />}</AnimatePresence>

        <WorkflowProgress
          status={state.status}
          steps={state.steps}
          errorMessage={state.lastError ?? uploadError}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t bg-white px-3 py-3 flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onFilePick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Upload resume"
          title="Upload resume (PDF, DOCX, TXT)"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Working…" : "Ask me to change something…"}
          disabled={sending || busy}
          className="flex-1 text-sm rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2 outline-none focus:border-blue-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || busy}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
