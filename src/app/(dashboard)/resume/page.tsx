import { auth } from "@/lib/auth/config";
import { resumeRepository } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, Plus, Edit, Download, Trash2, Clock } from "lucide-react";
import { TEMPLATE_META } from "@/types/resume";

export const metadata = { title: "My Resumes" };

export default async function ResumesPage() {
  const session = await auth();
  const resumes = await resumeRepository.findByUser(session!.user!.id as string);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
          <p className="text-gray-500">{resumes.length} resume{resumes.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/resume/new">
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" /> New Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No resumes yet</h3>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">Create your first AI-optimized resume in minutes. Choose from 8 professional templates.</p>
            <Link href="/resume/new">
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" /> Create Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => {
            const template = TEMPLATE_META[resume.templateId as keyof typeof TEMPLATE_META];
            const r = resume as typeof resume & { _count?: { experiences: number; versions: number } };
            return (
              <Card key={resume.id} className="group hover:shadow-lg transition-all duration-200">
                {/* Color strip */}
                <div className="h-2 rounded-t-lg" style={{ backgroundColor: template?.previewColor ?? "#3B82F6" }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {resume.title}
                      </h3>
                      <Badge variant="outline" className="mt-1 text-xs">{template?.name ?? resume.templateId}</Badge>
                    </div>
                    {resume.isDefault && <Badge variant="success" className="text-xs">Default</Badge>}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                    {r._count && (
                      <>
                        <span>{r._count.experiences} jobs</span>
                        <span>{r._count.versions} versions</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/resume/${resume.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* New Resume card */}
          <Link href="/resume/new">
            <Card className="border-dashed cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-blue-100 mb-3 transition-colors">
                  <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">New Resume</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
