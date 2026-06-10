"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Sparkles, CheckCircle, AlertCircle, X, Cpu, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IngestTemplateScreenshotOutput, IngestTemplateSource } from "@/domains/resume/actions";

export interface IngestionApplyPayload {
  shell: IngestTemplateScreenshotOutput["shell"];
  header: string;
  section: string;
  uppercase: boolean;
  sidebarWidthPct?: number;
  sidebarBg?: string;
  mainSections: string[];
  sidebarSections?: string[];
}

interface Props {
  onApply: (payload: IngestionApplyPayload) => void;
}

type State =
  | { phase: "idle" }
  | { phase: "dragging" }
  | { phase: "analyzing" }
  | { phase: "done"; result: IngestTemplateScreenshotOutput }
  | { phase: "error"; message: string };

const SOURCE_LABELS: Record<IngestTemplateSource, { label: string; icon: React.ReactNode; color: string; tip: string }> = {
  worker: {
    label: "Local OpenCV",
    icon: <Cpu className="w-3 h-3" />,
    color: "text-emerald-400",
    tip: "Detected locally — no AI cost",
  },
  haiku: {
    label: "Claude Haiku",
    icon: <Zap className="w-3 h-3" />,
    color: "text-violet-400",
    tip: "Fast AI pass",
  },
  sonnet: {
    label: "Claude Sonnet",
    icon: <Star className="w-3 h-3" />,
    color: "text-amber-400",
    tip: "Quality AI pass (auto-escalated from Haiku)",
  },
};

export function TemplateIngestionPanel({ onApply }: Props) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const runAnalysis = useCallback(async (file: File) => {
    setState({ phase: "analyzing" });
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/admin/templates/analyze", {
        method: "POST",
        body: fd,
      });
      const json = await res.json() as IngestTemplateScreenshotOutput & { error?: string };
      if (!res.ok || json.error) {
        setState({ phase: "error", message: json.error ?? "Analysis failed" });
        return;
      }
      setState({ phase: "done", result: json });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      void runAnalysis(file);
    },
    [runAnalysis],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState({ phase: "idle" });
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const reset = () => setState({ phase: "idle" });

  const handleApply = () => {
    if (state.phase !== "done") return;
    const r = state.result;
    onApply({
      shell: r.shell,
      header: r.header,
      section: r.section,
      uppercase: r.uppercase,
      sidebarWidthPct: r.sidebarWidthPct,
      sidebarBg: r.sidebarBg,
      mainSections: r.mainSections,
      sidebarSections: r.sidebarSections,
    });
    reset();
  };

  return (
    <section className="bg-gray-900 border border-violet-500/30 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          AI Quick Add
        </h2>
        <span className="ml-auto text-[10px] text-gray-600">
          Upload a template screenshot — AI detects layout config automatically.
        </span>
      </div>

      {/* Idle / Dragging */}
      {(state.phase === "idle" || state.phase === "dragging") && (
        <div
          onDragOver={(e) => { e.preventDefault(); setState({ phase: "dragging" }); }}
          onDragLeave={() => setState({ phase: "idle" })}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all",
            state.phase === "dragging"
              ? "border-violet-500 bg-violet-900/20"
              : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50",
          )}
        >
          <Upload className={cn("w-8 h-8", state.phase === "dragging" ? "text-violet-400" : "text-gray-500")} />
          <div className="text-center">
            <p className="text-sm text-gray-300">
              {state.phase === "dragging" ? "Drop to analyze" : "Drop a template screenshot or click to browse"}
            </p>
            <p className="text-[10px] text-gray-600 mt-1">JPEG · PNG · WebP · max 5 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Analyzing */}
      {state.phase === "analyzing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-violet-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-300">Analyzing layout…</p>
            <p className="text-[10px] text-gray-600">
              Local OpenCV → Claude Haiku → Sonnet (only if needed)
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {state.phase === "error" && (
        <div className="flex items-start gap-3 bg-red-950/30 border border-red-500/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-300 font-medium">Analysis failed</p>
            <p className="text-xs text-red-400/70 mt-1 break-words">{state.message}</p>
          </div>
          <button onClick={reset} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Done */}
      {state.phase === "done" && (
        <div className="space-y-4">
          {/* Confidence + source */}
          <ConfidenceBar
            confidence={state.result.confidence}
            source={state.result.source}
            costUsd={state.result.costUsd}
          />

          {/* Config chips */}
          <div className="grid grid-cols-2 gap-2">
            <ConfigChip label="Shell" value={state.result.shell} />
            <ConfigChip label="Header" value={state.result.header} />
            <ConfigChip label="Section" value={state.result.section} />
            <ConfigChip label="Uppercase" value={state.result.uppercase ? "yes" : "no"} />
            {state.result.sidebarWidthPct != null && (
              <ConfigChip label="Sidebar width" value={`${state.result.sidebarWidthPct}%`} />
            )}
            {state.result.sidebarBg && (
              <ConfigChip label="Sidebar bg" value={state.result.sidebarBg} />
            )}
          </div>

          {/* AI notes */}
          {state.result.notes.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
              <ul className="space-y-1">
                {state.result.notes.slice(0, 5).map((note, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-2">
                    <span className="text-gray-600 shrink-0">·</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regions */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Main sections</p>
              <p className="text-gray-300">{state.result.mainSections.join(", ")}</p>
            </div>
            {state.result.sidebarSections && state.result.sidebarSections.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sidebar sections</p>
                <p className="text-gray-300">{state.result.sidebarSections.join(", ")}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Apply to form
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBar({
  confidence,
  source,
  costUsd,
}: {
  confidence: number;
  source: IngestTemplateSource;
  costUsd: number;
}) {
  const pct = Math.round(confidence * 100);
  const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const label = pct >= 75 ? "High confidence" : pct >= 50 ? "Medium confidence" : "Low confidence";
  const src = SOURCE_LABELS[source];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex items-center gap-3">
          <span className={cn("flex items-center gap-1 text-[10px] font-medium", src.color)} title={src.tip}>
            {src.icon}
            {src.label}
          </span>
          {costUsd > 0 && (
            <span className="text-[10px] text-gray-600">${costUsd.toFixed(4)} cost</span>
          )}
          {costUsd === 0 && (
            <span className="text-[10px] text-emerald-600">$0 — local</span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 50 && (
        <p className="text-[10px] text-amber-500/80">
          Low confidence — review carefully before applying.
        </p>
      )}
    </div>
  );
}

function ConfigChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
      <span className="text-[10px] text-gray-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-xs text-gray-200 font-mono truncate">{value}</span>
    </div>
  );
}
