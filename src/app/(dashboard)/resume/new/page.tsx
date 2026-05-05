"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TEMPLATE_META, type TemplateId } from "@/types/resume";
import { cn } from "@/lib/utils/cn";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Upload, Sparkles,
  FileText, Linkedin, BookOpen, X, CloudUpload, AlertCircle,
} from "lucide-react";

// ─── Step 0: How to start ────────────────────────────────────────────────────

type StartOption = "blank" | "ai" | "upload" | "linkedin" | "example";

const START_OPTIONS: { id: StartOption; icon: React.ElementType; label: string; desc: string }[] = [
  { id: "blank",    icon: FileText,  label: "Create new resume",       desc: "Start from scratch with our editor" },
  { id: "ai",       icon: Sparkles,  label: "Create with AI assistance", desc: "Let AI draft your resume content" },
  { id: "upload",   icon: Upload,    label: "Upload resume",            desc: "Import an existing PDF or DOCX file" },
  { id: "linkedin", icon: Linkedin,  label: "Create with LinkedIn profile", desc: "Import your LinkedIn data" },
  { id: "example",  icon: BookOpen,  label: "Create from example",     desc: "Start with a pre-filled sample" },
];

// ─── Step 1: Name + Template picker ─────────────────────────────────────────

function TemplatePicker({ selected, onSelect }: { selected: TemplateId; onSelect: (id: TemplateId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(Object.entries(TEMPLATE_META) as [TemplateId, typeof TEMPLATE_META[TemplateId]][]).map(([id, meta]) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            "relative overflow-hidden rounded-xl border-2 text-left transition-all group",
            selected === id ? "border-blue-500 shadow-md shadow-blue-100" : "border-gray-200 hover:border-gray-300"
          )}
        >
          {/* Color preview strip */}
          <div className="h-16 w-full relative" style={{ backgroundColor: meta.previewColor }}>
            {/* Mini resume lines */}
            <div className="absolute inset-0 flex flex-col justify-center px-3 gap-1.5 opacity-40">
              <div className="h-2 bg-white/70 rounded-full w-2/3" />
              <div className="h-1 bg-white/50 rounded-full w-1/2" />
              <div className="h-1 bg-white/40 rounded-full w-3/4" />
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-xs font-semibold text-gray-900">{meta.name}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{meta.description}</p>
          </div>
          {selected === id && (
            <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Upload flow ─────────────────────────────────────────────────────────────

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error";

function UploadFlow({ onComplete }: { onComplete: (id: string) => void }) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [fieldsFound, setFieldsFound] = useState(0);
  const [resumeId, setResumeId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragActive = useRef(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    const maxMB = 15;
    if (f.size > maxMB * 1024 * 1024) { setError(`File must be under ${maxMB}MB`); return; }
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"].includes(f.type)) {
      setError("Only PDF, DOCX, and DOC files are supported"); return;
    }
    setFile(f);
    setState("uploading");
    setProgress(0);
    setError("");

    // Simulate progress while uploading
    const tick = setInterval(() => setProgress((p) => Math.min(p + 12, 70)), 300);

    const form = new FormData();
    form.append("file", f);

    try {
      const res = await fetch("/api/resume/parse", { method: "POST", body: form });
      clearInterval(tick);

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(msg || "Upload failed");
      }

      setState("parsing");
      setProgress(85);

      const { resumeId: id, fieldsExtracted } = await res.json();
      setProgress(100);
      setState("done");
      setFieldsFound(fieldsExtracted ?? 0);
      setResumeId(id);
    } catch (err: any) {
      clearInterval(tick);
      setState("error");
      setError(err.message ?? "Something went wrong");
    }
  }, []);

  return (
    <div className="space-y-4">
      {state === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all",
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
          )}
        >
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-all",
            dragOver ? "bg-blue-100" : "bg-gray-100"
          )}>
            <CloudUpload className={cn("h-8 w-8", dragOver ? "text-blue-500" : "text-gray-400")} />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-700">Drop your resume here</p>
            <p className="text-sm text-gray-400 mt-1">or <span className="text-blue-600 underline">browse files</span></p>
          </div>
          <p className="text-xs text-gray-400">PDF, DOCX, DOC · Max 15 MB</p>
          <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {(state === "uploading" || state === "parsing") && file && (
        <div className="border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · {state === "uploading" ? "Uploading…" : "Parsing with AI…"}</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            {state === "parsing" ? "Claude AI is extracting your resume data…" : `${progress}% uploaded`}
          </p>
        </div>
      )}

      {state === "done" && (
        <div className="border border-green-200 bg-green-50 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-green-800">Resume parsed successfully!</p>
            <p className="text-sm text-green-600 mt-0.5">{fieldsFound} fields extracted from your resume</p>
          </div>
          <Button variant="gradient" onClick={() => onComplete(resumeId)} className="gap-2">
            Open in editor <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {state === "error" && (
        <div className="border border-red-200 bg-red-50 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="font-semibold text-red-800">Upload failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
          <Button variant="outline" onClick={() => { setState("idle"); setFile(null); setError(""); }}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function NewResumePage() {
  const router = useRouter();
  const [step, setStep] = useState<"options" | "details">("options");
  const [startOption, setStartOption] = useState<StartOption>("blank");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const body: any = { title: title.trim(), templateId };
      if (startOption === "example") body.useExample = true;
      if (startOption === "ai")      body.aiDraft = true;

      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { data } = await res.json();
      router.push(`/resume/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/resume" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to resumes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {step === "options" ? "Let's get started" : "Name your resume"}
        </h1>
        <p className="text-gray-500 mt-1">
          {step === "options" ? "How do you want to create your resume?" : "Give it a name and choose a template"}
        </p>
      </div>

      {step === "options" && (
        <div className="space-y-3">
          {START_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setStartOption(opt.id);
                if (opt.id === "upload") { setStep("details"); return; }
                if (opt.id === "linkedin") { alert("LinkedIn import coming soon!"); return; }
                setStep("details");
              }}
              className="flex items-center justify-between w-full rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 p-4 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <opt.icon className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {opt.label}
                    {opt.id === "ai" && (
                      <span className="ml-2 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 rounded-full">AI</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">{opt.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {step === "details" && startOption === "upload" && (
        <div className="space-y-5">
          <button
            onClick={() => setStep("options")}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h2 className="text-lg font-semibold">Upload your existing resume</h2>
          <UploadFlow onComplete={(id) => router.push(`/resume/${id}`)} />
        </div>
      )}

      {step === "details" && startOption !== "upload" && (
        <div className="space-y-7">
          <button
            onClick={() => setStep("options")}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          {/* Name input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Resume name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && title.trim() && handleCreate()}
              placeholder="e.g. Senior Engineer — Google Application"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Tip: Name it after the role and company for easy tracking
            </p>
          </div>

          {/* Template picker */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Choose a template</p>
            <TemplatePicker selected={templateId} onSelect={setTemplateId} />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            variant="gradient"
            className="gap-2 w-full sm:w-auto"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {creating ? "Creating…" : "Create Resume"}
          </Button>
        </div>
      )}
    </div>
  );
}
