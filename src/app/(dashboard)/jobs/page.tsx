import { auth } from "@/lib/auth/config";
import { getUserTier } from "@/lib/auth/helpers";
import { gateLinkedInFetcher } from "@/lib/features/gate";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Search, TrendingUp, MapPin, Building, ExternalLink, Zap, Clock } from "lucide-react";
import { JobSearchSetup } from "@/components/jobs/JobSearchSetup";

export const metadata = { title: "Job Board" };

export default async function JobsPage() {
  const session = await auth();
  const userId = session!.user!.id as string;
  const tier = await getUserTier(userId);

  const gate = gateLinkedInFetcher(tier);

  if (!gate.allowed) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mx-auto mb-4">
          <Briefcase className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">LinkedIn Job Board</h1>
        <p className="text-gray-500 mb-6">
          Set your search criteria, let AI score every job against your profile daily, and surface only the best matches.
        </p>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 mb-6 text-left">
          {["Daily LinkedIn job scraping", "AI match scoring (50/70/100% thresholds)", "Ranked opportunities by fit", "One-click apply tracking"].map((f) => (
            <p key={f} className="flex items-center gap-2 text-sm text-blue-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" /> {f}
            </p>
          ))}
        </div>
        <Link href="/pricing">
          <Button variant="gradient" size="lg" className="gap-2">
            <Zap className="h-4 w-4" /> Upgrade to Pro
          </Button>
        </Link>
      </div>
    );
  }

  const searches = await db.jobSearch.findMany({
    where: { userId },
    include: { _count: { select: { jobs: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Fetch top matched jobs across all searches
  const topJobs = searches.length > 0
    ? await db.linkedInJob.findMany({
        where: { jobSearchId: { in: searches.map((s) => s.id) }, evaluated: true },
        orderBy: [{ matchPercentage: "desc" }, { postedAt: "desc" }],
        take: 20,
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="text-gray-500">AI-curated matches from LinkedIn</p>
        </div>
      </div>

      {searches.length === 0 ? (
        <JobSearchSetup />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Searches sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Active Searches</h2>
            </div>
            {searches.map((s) => {
              const sc = s as typeof s & { _count: { jobs: number } };
              return (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Search className="h-3 w-3" />{s.keywords.join(", ")}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">{sc._count.jobs} jobs</Badge>
                      <Badge variant={s.isActive ? "success" : "secondary"} className="text-xs">
                        {s.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <JobSearchSetup compact />
          </div>

          {/* Job listings */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Top Matches</h2>
            {topJobs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12">
                  <Clock className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-500">Fetching jobs...</p>
                  <p className="text-xs text-gray-400 mt-1">AI is scoring jobs against your profile. Check back shortly.</p>
                </CardContent>
              </Card>
            ) : (
              topJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{job.title}</p>
                          {job.easyApply && <Badge variant="success" className="text-[10px] px-1.5 shrink-0">Easy Apply</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Building className="h-3 w-3" />{job.company}</span>
                          {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-bold ${
                          (job.matchPercentage ?? 0) >= 70 ? "text-green-600" :
                          (job.matchPercentage ?? 0) >= 50 ? "text-yellow-600" : "text-red-500"
                        }`}>
                          {job.matchPercentage ?? "—"}%
                        </div>
                        <p className="text-[10px] text-gray-400">match</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Link href={`/applications/new?jobId=${job.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <TrendingUp className="h-3 w-3" /> Align Resume
                        </Button>
                      </Link>
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                          <ExternalLink className="h-3 w-3" /> View Job
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
