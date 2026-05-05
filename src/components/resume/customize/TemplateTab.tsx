"use client";

import { useCustomizeStore, PRESET_COLORS, type TemplateFilter } from "@/stores/customize.store";
import { useResumeStore } from "@/stores/resume.store";
import { ResumeCanvasThumbnail } from "../ResumeCanvas";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect } from "react";
import type { TemplateMeta } from "@/lib/template-service";

const FILTER_OPTIONS: { value: TemplateFilter; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "photo",      label: "With photo" },
  { value: "two-column", label: "Two column" },
  { value: "ats",        label: "ATS" },
  { value: "free",       label: "Free" },
];

export function TemplateTab() {
  const { templateId, mainColor, templateFilter, setTemplate, setMainColor, setTemplateFilter } = useCustomizeStore();
  const setStoreTemplate = useResumeStore((s) => s.setTemplate);
  const [customColor, setCustomColor] = useState(mainColor);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const handleSelectTemplate = (id: string) => {
    setTemplate(id as Parameters<typeof setTemplate>[0]);
    setStoreTemplate(id as Parameters<typeof setStoreTemplate>[0]);
  };

  const filteredTemplates = templateFilter === "all"
    ? templates
    : templates.filter((t) => t.tags.includes(templateFilter));

  return (
    <div className="flex flex-col h-full">
      {/* Color swatches */}
      <div className="px-4 py-4 border-b">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Main Color</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => { setMainColor(color); setCustomColor(color); }}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
              style={{
                background: color,
                borderColor: mainColor === color ? "white" : color,
                outline: mainColor === color ? `2.5px solid ${color}` : "none",
                outlineOffset: "1px",
              }}
            >
              {mainColor === color && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
          ))}
          <label
            className="w-7 h-7 rounded-full border-2 border-gray-300 bg-gradient-to-br from-red-400 via-green-400 to-blue-500 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
            title="Custom color"
          >
            <span className="text-white font-bold text-xs">+</span>
            <input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setMainColor(e.target.value); }}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTemplateFilter(f.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                templateFilter === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              )}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredTemplates.map((t) => {
            const isSelected = templateId === t.slug;
            return (
              <button
                key={t.slug}
                onClick={() => handleSelectTemplate(t.slug)}
                className="group relative flex flex-col items-center text-left"
              >
                <div className={cn(
                  "relative w-full overflow-hidden rounded-lg border-2 transition-all",
                  isSelected ? "border-blue-500 shadow-lg shadow-blue-100" : "border-gray-200 hover:border-gray-400"
                )}>
                  {/* Thumbnail image if available, otherwise live canvas render */}
                  {t.thumbnail ? (
                    <div className="aspect-[210/297] w-full relative">
                      <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <ResumeCanvasThumbnail templateId={t.slug as Parameters<typeof ResumeCanvasThumbnail>[0]["templateId"]} mainColor={mainColor} />
                  )}

                  {/* Hover overlay */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-blue-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold bg-blue-700/60 px-3 py-1.5 rounded-full">
                        Use this template
                      </span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* PDF/DOCX badges */}
                  <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                    <span className="text-[7px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-sm">PDF</span>
                    <span className="text-[7px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-sm">DOCX</span>
                  </div>

                  {/* Tier badge if not FREE */}
                  {t.minTier !== "FREE" && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[7px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-sm uppercase">{t.minTier}</span>
                    </div>
                  )}
                </div>

                <span className={cn(
                  "mt-1.5 text-xs font-medium",
                  isSelected ? "text-blue-600" : "text-gray-700"
                )}>{t.name}</span>
              </button>
            );
          })}
          {filteredTemplates.length === 0 && templates.length > 0 && (
            <div className="col-span-2 py-10 text-center text-gray-400 text-sm">
              No templates match this filter.
            </div>
          )}
          {templates.length === 0 && (
            <div className="col-span-2 py-10 text-center text-gray-300 text-sm">
              Loading templates…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
