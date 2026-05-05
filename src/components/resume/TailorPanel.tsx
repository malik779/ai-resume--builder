"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Search, Loader2, Sparkles, Heart, Clock, AlertCircle, TrendingUp, ChevronRight } from "lucide-react";
import type { Resume } from "@/types/resume";

// ─── Types ─────────────────────────────────────────────────────────────────

interface MatchResult {
  overallScore: number;
  keywordsScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  missingKeywords: string[];
  improvements: string[];
}

interface SampleJob {
  title: string;
  company: string;
  location: string;
  daysAgo: number;
  match: number;
  initial: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function matchColor(score: number) {
  if (score >= 80) return { badge: "bg-green-100 text-green-700", bar: "bg-green-500" };
  if (score >= 60) return { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
  return { badge: "bg-red-100 text-red-700", bar: "bg-red-500" };
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  const { bar } = matchColor(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-700 tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Sample jobs (shown before analysis) ──────────────────────────────────

function getSampleJobs(resume: Resume | null): SampleJob[] {
  const title = resume?.personalInfo?.headline ?? "Software Engineer";
  const skills = resume?.skills?.slice(0, 3).map((s) => s.name) ?? [];

  return [
    { title: `Senior ${title}`, company: "Stripe", location: "Remote", daysAgo: 2, match: 82, initial: "S" },
    { title: `${title}`, company: "Vercel", location: "San Francisco, CA", daysAgo: 5, match: 74, initial: "V" },
    { title: `Lead ${title}`, company: "Linear", location: "Remote", daysAgo: 9, match: 61, initial: "L" },
  ];
}

// ─── Main component ────────────────────────────────────────────────────────

interface TailorPanelProps {
  resumeId: string;
  resume: Resume | null;
  onOpenAIWriter: (context?: string) => void;
}

export function TailorPanel({ resumeId, resume, onOpenAIWriter }: TailorPanelProps) {
  const [jobInput, setJobInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const sampleJobs = getSampleJobs(resume);

  const analyze = async () => {
    if (!jobInput.trim()) return;
    setLoading(true);
    setError("");
    setMatchResult(null);
    try {
      const res = await fetch(`/api/resume/${resumeId}/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobInput, resumeData: resume }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setMatchResult(data);
    } catch {
      setError("Analysis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const startTailoring = () => {
    if (!matchResult) return;
    const ctx = [
      "Tailor my resume for the following job posting. Analyze the gaps and suggest specific edits.",
      `\nJob Posting:\n${jobInput}`,
      matchResult.missingKeywords.length > 0
        ? `\nMissing keywords to incorporate: ${matchResult.missingKeywords.join(", ")}`
        : "",
      `\nCurrent match: ${matchResult.overallScore}%. Goal: 90%+`,
      "\nProvide before/after suggestions for each section that needs updating.",
    ].join("");
    onOpenAIWriter(ctx);
  };

  const { badge: scoreBadge } = matchResult ? matchColor(matchResult.overallScore) : { badge: "" };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <p className="font-bold text-sm text-gray-900">Tailor to Job</p>
        <p className="text-xs text-gray-400 mt-0.5">Analyze your resume against any job posting</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Job input ─────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 block">
            Paste a job posting or description:
          </label>
          <textarea
            value={jobInput}
            onChange={(e) => setJobInput(e.target.value)}
            placeholder="https://linkedin.com/jobs/view/... or paste the full job description text directly"
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none resize-none placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <button
            onClick={analyze}
            disabled={!jobInput.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
              : <><Search className="h-4 w-4" /> Analyze Job Match</>
            }
          </button>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* ── Match result ──────────────────────────────────── */}
        {matchResult && (
          <div className="space-y-4">
            {/* Score */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 text-center">
              <div className={cn(
                "text-5xl font-black tabular-nums mb-1",
                matchResult.overallScore >= 80 ? "text-green-600" :
                matchResult.overallScore >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {matchResult.overallScore}%
              </div>
              <p className="text-sm font-semibold text-gray-700">Job Match Score</p>
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score Breakdown</p>
              <BreakdownRow label="Keywords" value={matchResult.keywordsScore} />
              <BreakdownRow label="Skills" value={matchResult.skillsScore} />
              <BreakdownRow label="Experience" value={matchResult.experienceScore} />
              <BreakdownRow label="Education" value={matchResult.educationScore} />
            </div>

            {/* Missing keywords */}
            {matchResult.missingKeywords?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Missing Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missingKeywords.map((kw) => (
                    <span key={kw} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {matchResult.improvements?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended Improvements</p>
                <div className="space-y-2">
                  {matchResult.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-xs text-gray-700 leading-relaxed">{imp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={startTailoring}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-purple-200/50"
            >
              <Sparkles className="h-4 w-4" />
              Start tailoring ({matchResult.overallScore}% → 90%+)
            </button>
          </div>
        )}

        {/* ── Sample matching jobs (pre-analysis) ──────────── */}
        {!matchResult && !loading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matching Jobs</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <TrendingUp className="h-3 w-3" />
                Based on your profile
              </div>
            </div>
            <div className="space-y-2">
              {sampleJobs.map((job) => {
                const { badge } = matchColor(job.match);
                const saved = savedJobs.has(job.title);
                return (
                  <div
                    key={job.title}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all group"
                    onClick={() => setJobInput(`${job.title} position at ${job.company}\n\nLocation: ${job.location}\n\nWe are looking for an experienced ${job.title} to join our team...`)}
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {job.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.company} · {job.location}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Clock className="h-3 w-3" /> {job.daysAgo}d ago
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", badge)}>
                        {job.match}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSavedJobs((prev) => {
                            const next = new Set(prev);
                            if (next.has(job.title)) next.delete(job.title); else next.add(job.title);
                            return next;
                          });
                        }}
                        className="transition-colors"
                      >
                        <Heart className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          saved ? "text-red-500 fill-red-500" : "text-gray-300 hover:text-red-400"
                        )} />
                      </button>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-blue-400 transition-colors shrink-0 self-center" />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Click a job to pre-fill the analysis field
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
