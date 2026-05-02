"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils/cn";
import type { EnhanceOutput } from "@/lib/ai/types";

interface EnhancePanelProps {
  resumeId: string;
  sectionType: "summary" | "experience" | "skills" | "education" | "projects";
  currentContent: string;
  targetRole?: string;
  onAccept: (enhancedContent: string) => void;
}

export function EnhancePanel({ resumeId, sectionType, currentContent, targetRole, onAccept }: EnhancePanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhanceOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [honestyLevel, setHonestyLevel] = useState<"strict" | "moderate" | "creative">("strict");

  const enhance = async () => {
    if (!currentContent.trim()) {
      toast({ title: "Nothing to enhance", description: "Add some content first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, sectionType, currentContent, targetRole, honestyLevel }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "UPGRADE_REQUIRED") {
          toast({ title: "Upgrade required", description: json.error, variant: "destructive" });
          return;
        }
        throw new Error(json.error);
      }
      setResult(json.data);
    } catch (e) {
      toast({ title: "Enhancement failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.enhancedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">AI Enhancement</p>
          <p className="text-xs text-gray-400">Claude-powered resume optimization</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Honesty level */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Enhancement Mode</p>
          <div className="flex gap-2">
            {(["strict", "moderate", "creative"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setHonestyLevel(level)}
                className={cn(
                  "flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-all",
                  honestyLevel === level
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {honestyLevel === "strict" ? "Facts only, better presentation" :
             honestyLevel === "moderate" ? "Careful skill elevation" :
             "Broader reframing allowed"}
          </p>
        </div>

        <Button
          onClick={enhance}
          disabled={loading}
          variant="gradient"
          size="sm"
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Enhance with AI
            </>
          )}
        </Button>

        {/* Loading state */}
        {loading && (
          <div className="space-y-2">
            <div className="h-3 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 rounded bg-gray-100 animate-pulse w-5/6" />
            <div className="h-3 rounded bg-gray-100 animate-pulse w-4/6" />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Scores */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Confidence", value: result.confidenceScore },
                { label: "Readability", value: result.readabilityScore },
                { label: "ATS Coverage", value: result.atsKeywordCoverage },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 p-2.5 text-center">
                  <div className={cn(
                    "text-lg font-bold",
                    s.value >= 80 ? "text-green-600" : s.value >= 60 ? "text-yellow-600" : "text-red-500"
                  )}>
                    {s.value}%
                  </div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Enhanced content */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Enhanced Version</p>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result.enhancedContent}</p>
              </div>
            </div>

            {/* Placeholder warning */}
            {result.placeholderCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700">
                  {result.placeholderCount} placeholder{result.placeholderCount > 1 ? "s" : ""} added — replace with your real data before applying.
                </p>
              </div>
            )}

            {/* Keywords */}
            {result.suggestedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Suggested Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestedKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements list */}
            {result.improvementsMade.length > 0 && (
              <div>
                <button
                  onClick={() => setShowImprovements(!showImprovements)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                >
                  {showImprovements ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {result.improvementsMade.length} improvements made
                </button>
                {showImprovements && (
                  <ul className="mt-2 space-y-1">
                    {result.improvementsMade.map((imp, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="mt-0.5 text-green-500">✓</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => onAccept(result.enhancedContent)} size="sm" className="flex-1 gap-1.5">
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={enhance} variant="ghost" size="sm">
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
