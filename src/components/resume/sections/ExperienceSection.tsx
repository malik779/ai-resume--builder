"use client";

import { useState } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { useSectionMutation } from "@/hooks/useResume";
import { EnhancePanel } from "@/components/ai/EnhancePanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, GripVertical } from "lucide-react";
import type { WorkExperience } from "@/types/resume";
import { v4 as uuid } from "uuid";
import { toast } from "@/components/ui/toaster";

interface ExperienceSectionProps {
  resumeId: string;
}

function BulletEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (bullets: string[]) => void;
}) {
  const add = () => onChange([...bullets, ""]);
  const update = (i: number, v: string) => {
    const next = [...bullets];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-1.5">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <textarea
            value={b}
            onChange={(e) => update(i, e.target.value)}
            rows={2}
            placeholder="Start with a strong action verb: Led, Built, Reduced, Increased..."
            className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm resize-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />
          <button
            onClick={() => remove(i)}
            className="mt-1.5 rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
      >
        <Plus className="h-3.5 w-3.5" /> Add bullet
      </button>
    </div>
  );
}

function ExperienceCard({
  exp,
  resumeId,
  onUpdate,
  onDelete,
}: {
  exp: WorkExperience;
  resumeId: string;
  onUpdate: (data: Partial<WorkExperience>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAI, setShowAI] = useState(false);

  const field = (key: keyof WorkExperience) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onUpdate({ [key]: e.target.value });

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <GripVertical className="h-4 w-4 text-gray-300 shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {exp.title || <span className="text-gray-300">Position title</span>}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {exp.company || "Company"} · {exp.startDate || "Start"} – {exp.current ? "Present" : (exp.endDate || "End")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
              <input value={exp.title} onChange={field("title")} placeholder="Senior Engineer"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Company</label>
              <input value={exp.company} onChange={field("company")} placeholder="Company Inc."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Location</label>
            <input value={exp.location ?? ""} onChange={field("location")} placeholder="San Francisco, CA"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input value={exp.startDate} onChange={field("startDate")} placeholder="Jan 2022"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <div className="flex items-center gap-2">
                <input
                  value={exp.current ? "Present" : (exp.endDate ?? "")}
                  onChange={field("endDate")}
                  disabled={exp.current}
                  placeholder="Dec 2023"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={exp.current} onChange={(e) => onUpdate({ current: e.target.checked })} className="rounded" />
                  Now
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Achievements & Responsibilities</label>
              <button
                onClick={() => setShowAI(!showAI)}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                AI Enhance
              </button>
            </div>
            <BulletEditor
              bullets={exp.bullets}
              onChange={(bullets) => onUpdate({ bullets })}
            />
          </div>

          {showAI && (
            <EnhancePanel
              resumeId={resumeId}
              sectionType="experience"
              currentContent={exp.bullets.join("\n")}
              onAccept={(enhanced) => {
                const bullets = enhanced.split("\n").map((b) => b.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
                onUpdate({ bullets });
                setShowAI(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ExperienceSection({ resumeId }: ExperienceSectionProps) {
  const { resume, addExperience, updateExperience, removeExperience } = useResumeStore();
  const { mutate } = useSectionMutation(resumeId);

  const handleAdd = async () => {
    const newExp: WorkExperience = {
      id: uuid(),
      company: "",
      title: "",
      startDate: "",
      current: false,
      bullets: [],
      order: (resume?.experiences.length ?? 0),
    };
    addExperience(newExp);
    try {
      const { data } = await mutate("experience", "create", {
        data: { company: "", title: "", startDate: "", bullets: [], order: newExp.order },
      });
      // Sync the server-assigned ID back
      updateExperience(newExp.id, { id: data.id });
    } catch {
      toast({ title: "Failed to add experience", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string, data: Partial<WorkExperience>) => {
    updateExperience(id, data);
    try {
      await mutate("experience", "update", { id, data: data as Record<string, unknown> });
    } catch {
      // Silent — will retry on next auto-save
    }
  };

  const handleDelete = async (id: string) => {
    removeExperience(id);
    try {
      await mutate("experience", "delete", { id });
    } catch {
      toast({ title: "Failed to delete experience", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {(resume?.experiences ?? []).map((exp) => (
        <ExperienceCard
          key={exp.id}
          exp={exp}
          resumeId={resumeId}
          onUpdate={(data) => handleUpdate(exp.id, data)}
          onDelete={() => handleDelete(exp.id)}
        />
      ))}

      <Button variant="outline" size="sm" onClick={handleAdd} className="w-full gap-2 border-dashed">
        <Plus className="h-4 w-4" /> Add Experience
      </Button>
    </div>
  );
}
