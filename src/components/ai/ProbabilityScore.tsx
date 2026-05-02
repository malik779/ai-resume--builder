"use client";

import { cn } from "@/lib/utils/cn";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ScoreOutput } from "@/lib/ai/types";
import { TrendingUp, Clock, Users, Target } from "lucide-react";

interface ProbabilityScoreProps {
  score: ScoreOutput;
}

const SCORE_COLOR = (n: number) =>
  n >= 80 ? "text-green-600" : n >= 60 ? "text-blue-600" : n >= 40 ? "text-yellow-600" : "text-red-500";

const SCORE_BG = (n: number) =>
  n >= 80 ? "bg-green-500" : n >= 60 ? "bg-blue-500" : n >= 40 ? "bg-yellow-500" : "bg-red-500";

// SVG circular score ring
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#2563eb" : score >= 40 ? "#ca8a04" : "#dc2626";

  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r}
          fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
        <text x="64" y="60" textAnchor="middle" className="fill-gray-900" fontSize="26" fontWeight="700">{score}</text>
        <text x="64" y="78" textAnchor="middle" className="fill-gray-400" fontSize="11">/ 100</text>
      </svg>
      <p className="text-sm font-semibold text-gray-600 -mt-2">Match Score</p>
    </div>
  );
}

export function ProbabilityScore({ score }: ProbabilityScoreProps) {
  return (
    <div className="space-y-6">
      {/* Score ring + probabilities */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={score.probabilityScore} />

          <div className="flex-1 space-y-4 w-full">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Screening Pass</span>
                <span className="text-sm font-semibold">{score.probabilityRanges.screeningPass}</span>
              </div>
              <Progress value={parseInt(score.probabilityRanges.screeningPass)} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Interview</span>
                <span className="text-sm font-semibold">{score.probabilityRanges.interviewProbability}</span>
              </div>
              <Progress value={parseInt(score.probabilityRanges.interviewProbability)} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Offer</span>
                <span className="text-sm font-semibold">{score.probabilityRanges.offerProbability}</span>
              </div>
              <Progress value={parseInt(score.probabilityRanges.offerProbability)} className="h-2" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{score.timelineEstimate.expectedResponseDays}d response</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{score.competitiveContext.estimatedApplicantPool}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Target className="h-4 w-4" />
            <span>{score.competitiveContext.yourProjectedPercentile}</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Score Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(score.breakdown).map(([key, data]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 capitalize">{key.replace(/_/g, " ")}</span>
                <span className={cn("text-xs font-bold", SCORE_COLOR(data.score))}>{data.score}%</span>
              </div>
              <Progress value={data.score} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Improvement roadmap */}
      {score.improvementRoadmap.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Improvement Roadmap</h3>
          <div className="space-y-3">
            {score.improvementRoadmap.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {item.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={item.impact === "high" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {item.impact} impact
                    </Badge>
                    <span className="text-xs text-gray-400">{item.effort}</span>
                    {item.cost && item.cost !== "$0" && <span className="text-xs text-gray-400">{item.cost}</span>}
                  </div>
                </div>
                <div className="text-sm font-bold text-green-600">+{item.expectedScoreBump}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why you win */}
      {score.competitiveContext.whyYouWin && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Your Competitive Edge</p>
              <p className="text-sm text-green-700">{score.competitiveContext.whyYouWin}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
