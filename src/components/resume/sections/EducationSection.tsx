"use client";

import { useState } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { useSectionMutation } from "@/hooks/useResume";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Education } from "@/types/resume";
import { v4 as uuid } from "uuid";
import { toast } from "@/components/ui/toaster";

interface EducationSectionProps { resumeId: string; }

function EducationCard({
  edu,
  onUpdate,
  onDelete,
}: {
  edu: Education;
  onUpdate: (data: Partial<Education>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const field = (key: keyof Education) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onUpdate({ [key]: e.target.value });

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {edu.degree || <span className="text-gray-300">Degree</span>}
            {edu.field ? ` in ${edu.field}` : ""}
          </p>
          <p className="text-xs text-gray-400 truncate">{edu.institution || "Institution"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Degree</label>
              <input value={edu.degree} onChange={field("degree")} placeholder="Bachelor of Science"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Field of Study</label>
              <input value={edu.field ?? ""} onChange={field("field")} placeholder="Computer Science"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Institution</label>
            <input value={edu.institution} onChange={field("institution")} placeholder="University of..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input value={edu.startDate} onChange={field("startDate")} placeholder="Sep 2018"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input value={edu.current ? "Present" : (edu.endDate ?? "")} onChange={field("endDate")} disabled={edu.current} placeholder="May 2022"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">GPA (optional)</label>
              <input value={edu.gpa ?? ""} onChange={field("gpa")} placeholder="3.8/4.0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Honors / Activities (optional)</label>
            <input value={edu.honors ?? ""} onChange={field("honors")} placeholder="Dean's List, Phi Beta Kappa, CS Club President"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
      )}
    </div>
  );
}

export function EducationSection({ resumeId }: EducationSectionProps) {
  const { resume, addEducation, updateEducation, removeEducation } = useResumeStore();
  const { mutate } = useSectionMutation(resumeId);

  const handleAdd = async () => {
    const newEdu: Education = {
      id: uuid(), institution: "", degree: "", startDate: "", current: false, order: (resume?.educations.length ?? 0),
    };
    addEducation(newEdu);
    try {
      const { data } = await mutate("education", "create", {
        data: { institution: "", degree: "", startDate: "", order: newEdu.order },
      });
      updateEducation(newEdu.id, { id: data.id });
    } catch {
      toast({ title: "Failed to add education", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string, data: Partial<Education>) => {
    updateEducation(id, data);
    try { await mutate("education", "update", { id, data: data as Record<string, unknown> }); } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    removeEducation(id);
    try { await mutate("education", "delete", { id }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  return (
    <div className="space-y-3">
      {(resume?.educations ?? []).map((edu) => (
        <EducationCard key={edu.id} edu={edu} onUpdate={(d) => handleUpdate(edu.id, d)} onDelete={() => handleDelete(edu.id)} />
      ))}
      <Button variant="outline" size="sm" onClick={handleAdd} className="w-full gap-2 border-dashed">
        <Plus className="h-4 w-4" /> Add Education
      </Button>
    </div>
  );
}
