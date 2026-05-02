"use client";

import { useResumeStore } from "@/stores/resume.store";
import { EnhancePanel } from "@/components/ai/EnhancePanel";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface SummarySectionProps {
  resumeId: string;
}

export function SummarySection({ resumeId }: SummarySectionProps) {
  const { resume, updateSummary } = useResumeStore();
  const [showAI, setShowAI] = useState(false);

  const summary = resume?.summary ?? "";

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={summary}
          onChange={(e) => updateSummary(e.target.value)}
          rows={5}
          placeholder="Write a compelling 2-3 sentence professional summary that highlights your key value proposition, years of experience, and what makes you unique..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none resize-none transition-all placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-300">
          {summary.length} chars
        </div>
      </div>

      <button
        onClick={() => setShowAI(!showAI)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
          showAI
            ? "bg-purple-50 text-purple-700 border border-purple-200"
            : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {showAI ? "Hide AI Enhancement" : "Enhance with AI"}
      </button>

      {showAI && (
        <EnhancePanel
          resumeId={resumeId}
          sectionType="summary"
          currentContent={summary}
          onAccept={(enhanced) => {
            updateSummary(enhanced);
            setShowAI(false);
          }}
        />
      )}
    </div>
  );
}
