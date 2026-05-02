"use client";

import { useResumeStore } from "@/stores/resume.store";
import { TEMPLATE_META } from "@/types/resume";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

export function TemplateSelector() {
  const { resume, setTemplate } = useResumeStore();
  const current = resume?.templateId ?? "modern";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Object.entries(TEMPLATE_META).map(([id, meta]) => (
        <button
          key={id}
          onClick={() => setTemplate(id)}
          className={cn(
            "relative overflow-hidden rounded-xl border-2 p-0 text-left transition-all",
            current === id ? "border-blue-500 shadow-md shadow-blue-200" : "border-gray-200 hover:border-gray-300"
          )}
        >
          {/* Color swatch */}
          <div className="h-16 w-full" style={{ backgroundColor: meta.previewColor }} />
          <div className="p-2">
            <p className="text-xs font-semibold text-gray-900">{meta.name}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{meta.description}</p>
          </div>
          {current === id && (
            <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
