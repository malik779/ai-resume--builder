"use client";

import { useState, useEffect } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { useAutoSave } from "@/hooks/useResume";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { SummarySection } from "./sections/SummarySection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection } from "./sections/SkillsSection";
import { ResumePreview } from "./ResumePreview";
import { TemplateSelector } from "./TemplateSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  User, FileText, Briefcase, GraduationCap, Wrench,
  Eye, EyeOff, Download, Save, CloudOff, Check, Loader2,
  Layout,
} from "lucide-react";
import type { ResumeWithRelations } from "@/lib/db/repositories/resume.repository";
import type { Resume } from "@/types/resume";

type EditorSection = "personal" | "summary" | "experience" | "education" | "skills" | "template";

const SECTIONS: { id: EditorSection; label: string; icon: React.ElementType }[] = [
  { id: "personal", label: "Contact Info", icon: User },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "template", label: "Template", icon: Layout },
];

interface ResumeEditorProps {
  resumeData: ResumeWithRelations;
  canExport: boolean;
  watermark: boolean;
}

export function ResumeEditor({ resumeData, canExport, watermark }: ResumeEditorProps) {
  const { resume, setResume, isDirty, isSaving } = useResumeStore();
  const { save } = useAutoSave(resumeData.id);
  const [activeSection, setActiveSection] = useState<EditorSection>("personal");
  const [showPreview, setShowPreview] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Hydrate store from server data on mount
  useEffect(() => {
    setResume({
      id: resumeData.id,
      userId: resumeData.userId,
      title: resumeData.title,
      templateId: resumeData.templateId,
      isDefault: resumeData.isDefault,
      personalInfo: (resumeData.personalInfo as unknown as Resume["personalInfo"]) ?? {},
      summary: resumeData.summary ?? undefined,
      experiences: resumeData.experiences.map((e) => ({
        id: e.id,
        company: e.company,
        title: e.title,
        location: e.location ?? undefined,
        startDate: e.startDate,
        endDate: e.endDate ?? undefined,
        current: e.current,
        bullets: (e.bullets as string[]) ?? [],
        order: e.order,
      })),
      educations: resumeData.educations.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        field: e.field ?? undefined,
        startDate: e.startDate,
        endDate: e.endDate ?? undefined,
        current: e.current,
        gpa: e.gpa ?? undefined,
        honors: e.honors ?? undefined,
        order: e.order,
      })),
      projects: resumeData.projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        bullets: (p.bullets as string[]) ?? [],
        url: p.url ?? undefined,
        techStack: (p.techStack as string[]) ?? [],
        order: p.order,
      })),
      skills: (resumeData.skills as unknown as Resume["skills"]) ?? [],
      certifications: (resumeData.certifications as unknown as Resume["certifications"]) ?? [],
      languages: (resumeData.languages as unknown as Resume["languages"]) ?? [],
      awards: (resumeData.awards as unknown as Resume["awards"]) ?? [],
      customSections: (resumeData.customSections as unknown as Resume["customSections"]) ?? [],
      atsScore: resumeData.atsScore ?? undefined,
      createdAt: resumeData.createdAt,
      updatedAt: resumeData.updatedAt,
    });
  }, [resumeData.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format: "pdf" | "docx") => {
    if (!canExport) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/resume/${resumeData.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume?.title ?? "resume"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const saveStatus = isSaving ? (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
    </span>
  ) : isDirty ? (
    <span className="flex items-center gap-1.5 text-xs text-yellow-500">
      <CloudOff className="h-3 w-3" /> Unsaved changes
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs text-green-500">
      <Check className="h-3 w-3" /> Saved
    </span>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">
      {/* Left panel — section navigation */}
      <div className="flex w-48 shrink-0 flex-col border-r bg-white">
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                activeSection === s.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="border-t p-3 space-y-2">
          {saveStatus}
          <Button size="sm" variant="outline" onClick={save} disabled={!isDirty || isSaving} className="w-full gap-1.5 text-xs">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Center panel — section editor */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-1.5 text-xs lg:hidden"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>

          {activeSection === "personal" && <PersonalInfoSection />}
          {activeSection === "summary" && <SummarySection resumeId={resumeData.id} />}
          {activeSection === "experience" && <ExperienceSection resumeId={resumeData.id} />}
          {activeSection === "education" && <EducationSection resumeId={resumeData.id} />}
          {activeSection === "skills" && <SkillsSection resumeId={resumeData.id} />}
          {activeSection === "template" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Choose a template for your resume. Your content is preserved when switching.</p>
              <TemplateSelector />
            </div>
          )}
        </div>
      </div>

      {/* Right panel — live preview */}
      <div className={cn("hidden flex-col border-l bg-white xl:flex", showPreview && "flex")} style={{ width: "45%" }}>
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-xs font-medium text-gray-500">Live Preview</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("pdf")}
              disabled={!canExport || exporting}
              className="gap-1.5 text-xs h-7 px-2.5"
            >
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("docx")}
              disabled={!canExport || exporting}
              className="gap-1.5 text-xs h-7 px-2.5"
            >
              DOCX
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="scale-[0.65] origin-top-left" style={{ width: "154%" }}>
            <ResumePreview watermark={watermark} />
          </div>
        </div>
      </div>
    </div>
  );
}
