"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface JobSearchSetupProps {
  compact?: boolean;
}

export function JobSearchSetup({ compact = false }: JobSearchSetupProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [threshold, setThreshold] = useState<50 | 70 | 100>(70);
  const [submitting, setSubmitting] = useState(false);

  const addKeyword = () => {
    const kw = keyword.trim();
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setKeyword("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || keywords.length === 0) {
      toast({ title: "Fill in name and at least one keyword", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          keywords,
          locations: location ? [location] : [],
          remoteOnly: remote,
          matchThreshold: threshold,
        }),
      });
      if (!res.ok) throw new Error("Failed to create job search");
      toast({ title: "Job search created!", description: "AI will fetch matching jobs shortly." });
      router.refresh();
      setOpen(false);
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full gap-2 border-dashed">
        <Plus className="h-4 w-4" /> New Search
      </Button>
    );
  }

  if (!open) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 mb-4">
            <Search className="h-7 w-7 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Set up your job search</h3>
          <p className="text-sm text-gray-400 text-center mb-6 max-w-xs">
            Tell us what you're looking for. AI will scan LinkedIn daily and surface the best matches.
          </p>
          <Button variant="gradient" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create Job Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">New Job Search</CardTitle>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Search Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior Engineer Roles"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Job Keywords</label>
          <div className="flex gap-2 mb-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              placeholder="e.g. Senior React Engineer"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button size="sm" variant="outline" onClick={addKeyword} disabled={!keyword.trim()}>Add</Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {kw}
                  <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, NY"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Match Threshold</label>
            <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value) as 50 | 70 | 100)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white">
              <option value={50}>50%+ match</option>
              <option value={70}>70%+ match</option>
              <option value={100}>100% match</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-600">Remote only</span>
        </label>

        <Button onClick={handleSubmit} disabled={submitting} variant="gradient" className="w-full gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating..." : "Create Job Search"}
        </Button>
      </CardContent>
    </Card>
  );
}
