"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/stores/resume.store";
import { useCustomizeStore } from "@/stores/customize.store";
import { useAutoSave } from "@/hooks/useResume";
import { resolveTemplateId } from "@/types/resume";

import { EditPanel } from "./EditPanel";
import { AIWriterPanel } from "./AIWriterPanel";
import { AIReviewPanel } from "./AIReviewPanel";
import { TailorPanel } from "./TailorPanel";
import { ResumeCanvas } from "./ResumeCanvas";
import { CustomizePanel } from "./customize/CustomizePanel";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  Download, Save, CloudOff, Check, Loader2, ChevronLeft,
  Sparkles, ChevronDown, Settings, Minus, Plus, ChevronRight,
} from "lucide-react";
import type { ResumeWithRelations } from "@/lib/db/repositories/resume.repository";
import type { Resume } from "@/types/resume";

// ─── Types ─────────────────────────────────────────────────────────────────

type Mode = "edit" | "customize" | "ai-review" | "tailor";

interface HeaderTab {
  id: Mode;
  label: string;
  badge?: string;
}

const TABS: HeaderTab[] = [
  { id: "edit",      label: "Edit" },
  { id: "customize", label: "Customize" },
  { id: "ai-review", label: "AI Review" },
  { id: "tailor",    label: "Tailor", badge: "NEW" },
];

// ─── Settings modal ─────────────────────────────────────────────────────────

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[61] -translate-x-1/2 -translate-y-1/2 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">AI Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">AI Provider</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option>Anthropic (Claude)</option>
              <option disabled>OpenAI (coming soon)</option>
              <option disabled>Google Gemini (coming soon)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Model Tier</label>
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium">Free (Haiku)</button>
              <button className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Pro (Sonnet)</button>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <span className="font-semibold">Currently using:</span> claude-haiku-4-5 (fast & free)
          </div>
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
          Close
        </button>
      </div>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface ResumeEditorProps {
  resumeData: ResumeWithRelations;
  canExport: boolean;
  watermark: boolean;
}

export function ResumeEditor({ resumeData, canExport, watermark }: ResumeEditorProps) {
  const router = useRouter();
  const { resume, setResume, isDirty, isSaving } = useResumeStore();
  const { setTemplate: setCustomizeTemplate } = useCustomizeStore();
  const { save } = useAutoSave(resumeData.id);

  const [mode, setMode] = useState<Mode>("edit");
  const [aiWriterOpen, setAIWriterOpen] = useState(false);
  const [aiWriterContext, setAIWriterContext] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = useState(85); // percentage (85 = nice default for most screens)
  const previewRef = useRef<HTMLDivElement>(null);

  // Hydrate store from server data
  useEffect(() => {
    setResume({
      id: resumeData.id,
      userId: resumeData.userId,
      title: resumeData.title,
      templateId: resumeData.templateId,
      isDefault: resumeData.isDefault,
      personalInfo: (resumeData.personalInfo as unknown as Resume["personalInfo"]) ?? {},
      summary: resumeData.summary ?? "",
      experiences: (resumeData.experiences as unknown as Resume["experiences"]) ?? [],
      educations: (resumeData.educations as unknown as Resume["educations"]) ?? [],
      projects: (resumeData.projects as unknown as Resume["projects"]) ?? [],
      skills: (resumeData.skills as unknown as Resume["skills"]) ?? [],
      certifications: (resumeData.certifications as unknown as Resume["certifications"]) ?? [],
      languages: (resumeData.languages as unknown as Resume["languages"]) ?? [],
      awards: (resumeData.awards as unknown as Resume["awards"]) ?? [],
      customSections: (resumeData.customSections as unknown as Resume["customSections"]) ?? [],
      atsScore: resumeData.atsScore ?? undefined,
      createdAt: resumeData.createdAt,
      updatedAt: resumeData.updatedAt,
    });
    setCustomizeTemplate(resolveTemplateId(resumeData.templateId));
  }, [resumeData.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard zoom shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") { e.preventDefault(); setZoom((z) => Math.min(150, z + 10)); }
        if (e.key === "-")                  { e.preventDefault(); setZoom((z) => Math.max(40, z - 10));  }
        if (e.key === "0")                  { e.preventDefault(); setZoom(85); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleExport = async (format: "pdf" | "docx") => {
    if (!canExport) return;
    setExporting(true);
    setExportOpen(false);
    try {
      const res = await fetch(`/api/resume/${resumeData.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume?.title ?? "resume"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const openAIWriter = useCallback((ctx?: string) => {
    setAIWriterContext(ctx ?? "");
    setAIWriterOpen(true);
  }, []);

  const closeAIWriter = useCallback(() => {
    setAIWriterOpen(false);
    setAIWriterContext("");
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setAIWriterOpen(false);
  };

  // Scale from 0–1 used by ResumeCanvas
  const canvasScale = zoom / 100;
  const canvasW = Math.round(794 * canvasScale);
  const canvasH = Math.round(1123 * canvasScale);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex h-13 items-center border-b bg-white px-3 shrink-0 gap-2" style={{ height: "52px" }}>

        {/* Left: back + logo + title */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <button
            onClick={() => router.push("/resume")}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm hidden lg:block">ResumeAI</span>
          </div>
          <span className="text-gray-200 hidden sm:block">·</span>
          <span className="text-sm text-gray-600 truncate max-w-[120px] md:max-w-[200px] hidden sm:block" title={resume?.title}>
            {resume?.title ?? resumeData.title}
          </span>
        </div>

        {/* Center: mode tabs */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchMode(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  mode === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {tab.label}
                {tab.badge && (
                  <span className="text-[9px] font-black bg-purple-500 text-white px-1.5 py-px rounded-full leading-none tracking-wide">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: save status + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden md:flex items-center text-xs mr-1">
            {isSaving ? (
              <span className="text-gray-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
            ) : isDirty ? (
              <span className="text-yellow-500 flex items-center gap-1"><CloudOff className="h-3 w-3" /> Unsaved</span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>
            )}
          </span>

          <Button size="sm" variant="outline" onClick={save} disabled={!isDirty || isSaving} className="gap-1.5 h-8 text-xs">
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          {/* Download dropdown */}
          <div className="relative">
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setExportOpen((o) => !o)}
              disabled={exporting}
              className="gap-1.5 h-8 text-xs"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Download</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={!canExport}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">PDF</span>
                    Download PDF
                  </button>
                  <button
                    onClick={() => handleExport("docx")}
                    disabled={!canExport}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t disabled:opacity-40"
                  >
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">DOCX</span>
                    Download DOCX
                  </button>
                  {!canExport && (
                    <div className="px-4 py-2 text-[10px] text-gray-400 border-t bg-gray-50">
                      Upgrade to Pro to export
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="AI Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel (40%) ───────────────────────────────── */}
        <div className="w-2/5 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden relative">
          {/* AI Writer slides over the left panel */}
          {aiWriterOpen && (
            <div
              className="absolute inset-0 z-10 bg-white flex flex-col"
              style={{ animation: "slideInLeft 150ms ease-out" }}
            >
              <AIWriterPanel
                resumeId={resumeData.id}
                initialContext={aiWriterContext}
                onClose={closeAIWriter}
              />
            </div>
          )}

          {/* Mode panels — ai-review shows in right panel, not here */}
          <div className={cn("flex flex-col h-full", aiWriterOpen && "invisible")}>
            {(mode === "edit" || mode === "ai-review") && (
              <EditPanel resumeId={resumeData.id} onOpenAIWriter={openAIWriter} />
            )}
            {mode === "customize" && (
              <div className="flex-1 overflow-hidden">
                <CustomizePanel />
              </div>
            )}
            {mode === "tailor" && (
              <TailorPanel
                resumeId={resumeData.id}
                resume={resume}
                onOpenAIWriter={(ctx) => {
                  openAIWriter(ctx);
                  setMode("edit");
                }}
              />
            )}
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* AI Review takes over the right panel */}
          {mode === "ai-review" ? (
            <AIReviewPanel resumeId={resumeData.id} resume={resume} />
          ) : (
            <>
              {/* Scrollable canvas area */}
              <div
                ref={previewRef}
                className="flex-1 overflow-auto bg-[#e8eaed] flex flex-col items-center py-10 gap-6"
              >
                {/* A4 page */}
                <div
                  className="shadow-2xl rounded-sm bg-white shrink-0"
                  style={{ width: `${canvasW}px`, height: `${canvasH}px` }}
                >
                  <ResumeCanvas scale={canvasScale} />
                </div>

                {/* Watermark notice */}
                {watermark && (
                  <div className="flex items-center gap-2 bg-white/80 border border-yellow-200 text-yellow-700 text-xs px-4 py-2 rounded-full shadow-sm shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade to remove watermark from exported files
                  </div>
                )}

                {/* Bottom spacer so controls don't overlap content */}
                <div className="h-14 shrink-0" />
              </div>

              {/* ── Zoom controls — absolute bottom-right ──── */}
              <div className="absolute bottom-5 right-5 flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl shadow-lg px-1.5 py-1">
                <button
                  onClick={() => setZoom((z) => Math.max(40, z - 10))}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Zoom out (Ctrl+-)"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  onDoubleClick={() => setZoom(85)}
                  className="px-2.5 py-0.5 text-xs font-semibold text-gray-700 min-w-[46px] text-center rounded-lg hover:bg-gray-50 tabular-nums"
                  title="Double-click to reset"
                >
                  {zoom}%
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Zoom in (Ctrl+=)"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* ── Page nav — absolute bottom-left ────────── */}
              <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-1.5">
                <button className="text-gray-300 cursor-default">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-semibold text-gray-700 tabular-nums">1 / 1</span>
                <button className="text-gray-300 cursor-default">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-8px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
