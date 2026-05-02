import { auth } from "@/lib/auth/config";
import { applicationRepository } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Plus, ExternalLink, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

export const metadata = { title: "Applications" };

const STATUS_META = {
  SAVED: { label: "Saved", color: "secondary", icon: Clock },
  APPLIED: { label: "Applied", color: "default", icon: Briefcase },
  SCREENING: { label: "Screening", color: "warning", icon: TrendingUp },
  INTERVIEW: { label: "Interview", color: "pro", icon: CheckCircle },
  OFFER: { label: "Offer", color: "success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "destructive", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", color: "secondary", icon: XCircle },
} as const;

export default async function ApplicationsPage() {
  const session = await auth();
  const applications = await applicationRepository.findByUser(session!.user!.id as string);

  const byStatus = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500">{applications.length} tracked</p>
        </div>
        <Button variant="gradient" className="gap-2">
          <Plus className="h-4 w-4" /> Add Application
        </Button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <Card key={key} className="text-center">
            <CardContent className="p-3">
              <div className="text-xl font-bold text-gray-900">{byStatus[key] ?? 0}</div>
              <div className="text-xs text-gray-400 mt-0.5">{meta.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application list */}
      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <Briefcase className="h-12 w-12 text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications yet</h3>
            <p className="text-sm text-gray-400 mb-6">Track your job applications and monitor your pipeline</p>
            <Link href="/jobs">
              <Button variant="outline">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const meta = STATUS_META[app.status];
            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate">{app.title}</p>
                      <Badge variant={meta.color as "default" | "secondary" | "destructive" | "success" | "warning" | "pro" | "enterprise" | "outline"}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{app.company}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {app.alignmentScore && (
                      <div className="text-right">
                        <div className={`text-sm font-bold ${app.alignmentScore >= 70 ? "text-green-600" : app.alignmentScore >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                          {app.alignmentScore}%
                        </div>
                        <div className="text-xs text-gray-400">match</div>
                      </div>
                    )}
                    {app.jobUrl && (
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
