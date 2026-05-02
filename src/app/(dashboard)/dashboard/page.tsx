import { auth } from "@/lib/auth/config";
import { getUserTier } from "@/lib/auth/helpers";
import { resumeRepository, aiUsageRepository, applicationRepository } from "@/lib/db";
import { getTierConfig } from "@/lib/features/tiers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, Briefcase, TrendingUp, Zap, Plus, ArrowRight } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id as string;
  const tier = await getUserTier(userId);
  const config = getTierConfig(tier);

  const [resumes, aiStats, applications] = await Promise.all([
    resumeRepository.findByUser(userId),
    aiUsageRepository.getStats(userId),
    applicationRepository.findByUser(userId),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const aiUsedThisMonth = aiStats.byOperation.ENHANCE ?? 0;
  const aiLimit = config.aiEnhancementsPerMonth === -1 ? "∞" : config.aiEnhancementsPerMonth;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {firstName}</h1>
          <p className="text-gray-500 mt-0.5">Your job search command center</p>
        </div>
        <Link href="/resume/new">
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            New Resume
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Resumes", value: resumes.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Applications", value: applications.length, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "AI Enhancements", value: `${aiUsedThisMonth}/${aiLimit}`, icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Interviews", value: applications.filter((a) => a.status === "INTERVIEW").length, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Resumes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Resumes</CardTitle>
            <Link href="/resume" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumes.slice(0, 5).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No resumes yet</p>
                <Link href="/resume/new">
                  <Button variant="outline" size="sm" className="mt-3">Create your first resume</Button>
                </Link>
              </div>
            ) : (
              resumes.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/resume/${r.id}`}
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: "/resume/new", label: "Create Resume", desc: "Start a new resume from scratch", icon: FileText, tier: null },
              { href: "/jobs", label: "Browse Jobs", desc: "AI-curated LinkedIn opportunities", icon: Briefcase, tier: "PRO" },
              { href: "/applications", label: "Track Applications", desc: "Monitor your job search pipeline", icon: TrendingUp, tier: null },
              { href: "/contacts", label: "Find Contacts", desc: "HR and hiring manager lookup", icon: Zap, tier: "ENTERPRISE" },
            ].map((action) => {
              const isLocked = action.tier && tier !== action.tier && !(action.tier === "PRO" && tier === "ENTERPRISE");
              return (
                <Link
                  key={action.href}
                  href={isLocked ? "/pricing" : action.href}
                  className="flex items-center justify-between rounded-lg border p-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                      <action.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {action.label}
                        {action.tier && isLocked && (
                          <Badge variant={action.tier === "ENTERPRISE" ? "enterprise" : "pro"} className="text-[10px] px-1.5 py-0">
                            {action.tier}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
