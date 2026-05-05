"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { RefreshCw, Loader2, Star, Zap } from "lucide-react";
import type { Resume } from "@/types/resume";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ReviewData {
  overallScore: number;
  atsScore: number;
  readabilityScore: number;
  rating: "Excellent" | "Good" | "Needs Work" | "Incomplete";
  summary: string;
  strengths: string[];
  tips: string[];
  missingKeywords: string[];
}

// ─── Faded resume skeleton (loading state visual) ──────────────────────────

function ResumeSkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm w-[300px] overflow-hidden" style={{ opacity: 0.75 }}>
      <div className="p-6 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <span className="text-xs text-gray-400 font-medium">Your resume</span>
          <div className="flex flex-col gap-1 items-end">
            <div className="h-1.5 w-16 bg-gray-200 rounded-full" />
            <div className="h-1.5 w-10 bg-gray-200 rounded-full" />
          </div>
        </div>
        {/* Content lines */}
        <div className="space-y-2 pt-1">
          <div className="h-1.5 w-24 bg-gray-200 rounded-full" />
          {/* Highlighted line (accent) */}
          <div className="h-3 w-44 bg-amber-200 rounded-full" />
          <div className="h-1.5 w-20 bg-gray-200 rounded-full" />
          <div className="space-y-1.5 pt-1">
            {[78, 92, 85, 68, 40, 55].map((w, i) => (
              <div
                key={i}
                className="h-1.5 bg-gray-100 rounded-full"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score badge row ───────────────────────────────────────────────────────

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const { color, bg } =
    score >= 80 ? { color: "text-green-700",  bg: "bg-green-50"  } :
    score >= 60 ? { color: "text-amber-600",  bg: "bg-amber-50"  } :
                  { color: "text-red-600",    bg: "bg-red-50"    };
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl", bg)}>
      <span className={cn("text-lg font-black tabular-nums", color)}>{score}</span>
      <span className="text-xs text-gray-500 leading-tight">{label}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface AIReviewPanelProps {
  resumeId: string;
  resume: Resume | null;
}

export function AIReviewPanel({ resumeId, resume }: AIReviewPanelProps) {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // Animated progress bar during load
  useEffect(() => {
    if (!loading) { setProgress(0); return; }
    const steps = [
      { target: 30, delay: 200 },
      { target: 55, delay: 1200 },
      { target: 75, delay: 2400 },
      { target: 88, delay: 4000 },
      { target: 94, delay: 7000 },
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(({ target, delay }) => {
      timers.push(setTimeout(() => setProgress(target), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const runReview = async () => {
    setLoading(true);
    setError("");
    setReviewData(null);
    try {
      const res = await fetch(`/api/resume/${resumeId}/ai-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: resume }),
      });
      if (!res.ok) throw new Error("Review failed");
      const data = await res.json();
      setProgress(100);
      setTimeout(() => { setReviewData(data); setLoading(false); }, 300);
    } catch {
      setError("Failed to analyze. Please try again.");
      setLoading(false);
    }
  };

  // ── Empty (first-time) state ───────────────────────────────
  if (!reviewData && !loading) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center gap-6 p-10">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-sm">
          <Star className="h-8 w-8 text-purple-600" />
        </div>
        <div className="text-center space-y-2 max-w-xs">
          <p className="font-bold text-gray-900 text-lg">AI Resume Review</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Get an instant score for ATS compatibility, readability, and overall resume quality — with specific improvement tips.
          </p>
        </div>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{error}</p>
        )}
        <button
          onClick={runReview}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-200"
        >
          <Zap className="h-4 w-4" />
          Analyze My Resume
        </button>
      </div>
    );
  }

  // ── Loading state (matches screenshot 1) ──────────────────
  if (loading) {
    return (
      <div className="h-full bg-[#f0f2f8] flex flex-col items-center justify-center gap-5">
        <ResumeSkeletonCard />

        {/* Progress bar */}
        <div className="w-[300px] h-0.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-gray-600">Reviewing your resume…</span>
        </div>
      </div>
    );
  }

  if (!reviewData) return null;

  // ── Results state (matches screenshot 2) ──────────────────

  const ratingStyle: Record<string, { star: string; text: string }> = {
    Excellent:    { star: "text-green-500", text: "text-green-700" },
    Good:         { star: "text-amber-400", text: "text-amber-600" },
    "Needs Work": { star: "text-red-400",   text: "text-red-600"   },
    Incomplete:   { star: "text-gray-400",  text: "text-gray-600"  },
  };
  const rs = ratingStyle[reviewData.rating] ?? ratingStyle["Needs Work"];

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-gray-900 text-base">Summary</h2>
        <button
          onClick={runReview}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Score badges row */}
        <div className="flex gap-2 px-8 pt-5 pb-2">
          <ScoreBadge label="Overall" score={reviewData.overallScore} />
          <ScoreBadge label="ATS" score={reviewData.atsScore} />
          <ScoreBadge label="Readability" score={reviewData.readabilityScore} />
        </div>

        <div className="px-8 space-y-5 pb-10">
          {/* Rating + summary */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Star className={cn("h-5 w-5", rs.star)} fill="currentColor" />
              <span className={cn("text-base font-bold", rs.text)}>{reviewData.rating}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{reviewData.summary}</p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Strengths */}
          {reviewData.strengths?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Strengths</h3>
              <ul className="space-y-2.5">
                {reviewData.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reviewData.tips?.length > 0 && <div className="border-t border-gray-100" />}

          {/* Quick tips */}
          {reviewData.tips?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Quick tips</h3>
              <ul className="space-y-2.5">
                {reviewData.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reviewData.missingKeywords?.length > 0 && <div className="border-t border-gray-100" />}

          {/* Missing keywords */}
          {reviewData.missingKeywords?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Missing keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {reviewData.missingKeywords.map((kw) => (
                  <span key={kw} className="text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
