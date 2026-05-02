"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TEMPLATE_META } from "@/types/resume";
import { cn } from "@/lib/utils/cn";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";

export default function NewResumePage() {
  const router = useRouter();
  const [step, setStep] = useState<"title" | "template">("title");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("modern");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), templateId }),
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
        <h1 className="text-2xl font-bold text-gray-900">Create New Resume</h1>
        <p className="text-gray-500">
          {step === "title" ? "Give your resume a name" : "Choose a template to start with"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {["title", "template"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-all",
              step === s ? "bg-blue-600 text-white" :
              (step === "template" && s === "title") ? "bg-green-500 text-white" :
              "bg-gray-100 text-gray-400"
            )}>
              {step === "template" && s === "title" ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-sm font-medium", step === s ? "text-gray-900" : "text-gray-400")}>
              {s === "title" ? "Name" : "Template"}
            </span>
            {i === 0 && <div className="h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === "title" && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Resume name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && title.trim() && setStep("template")}
              placeholder="e.g. Senior Engineer — Google Application"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Tip: Name it after the role and company you're targeting for easy tracking
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setStep("template")}
              disabled={!title.trim()}
              variant="gradient"
              className="gap-2"
            >
              Next: Choose Template <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "template" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(TEMPLATE_META).map(([id, meta]) => (
              <button
                key={id}
                onClick={() => setTemplateId(id)}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 text-left transition-all",
                  templateId === id ? "border-blue-500 shadow-md shadow-blue-200" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="h-20 w-full" style={{ backgroundColor: meta.previewColor }} />
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900">{meta.name}</p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{meta.description}</p>
                </div>
                {templateId === id && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("title")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleCreate} disabled={creating} variant="gradient" className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {creating ? "Creating..." : "Create Resume"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
