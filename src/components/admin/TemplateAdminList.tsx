"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Edit, Trash2, ImagePlus, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Template } from "@prisma/client";
import type { EngineConfig } from "@/components/resume/templates/engine";
import { createEngineRenderer } from "@/components/resume/templates/EngineRenderer";
import {
  SAMPLE_RESUME,
  PREVIEW_CSS_VARS,
  PREVIEW_TEMPLATE_PROPS,
} from "@/components/resume/templates/sample-resume";

interface Props {
  templates: Template[];
}

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-gray-700 text-gray-300",
  BASIC: "bg-blue-900 text-blue-300",
  PRO: "bg-violet-900 text-violet-300",
  ENTERPRISE: "bg-amber-900 text-amber-300",
};

// ── Mini live thumbnail for ENGINE templates ───────────────────────────────────

const THUMB_SCALE = 0.25;

function EngineTemplateThumbnail({ engineConfig, previewColor }: {
  engineConfig: unknown;
  previewColor: string;
}) {
  const config = engineConfig as EngineConfig;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Component = useMemo(() => createEngineRenderer(config), [JSON.stringify(config)]);

  return (
    <div className="w-full h-44 overflow-hidden relative bg-white">
      <div style={{
        ...PREVIEW_CSS_VARS,
        width:           794,
        transform:       `scale(${THUMB_SCALE})`,
        transformOrigin: "top left",
        position:        "absolute",
        top: 0, left: 0,
      }}>
        <Component
          {...PREVIEW_TEMPLATE_PROPS}
          resume={SAMPLE_RESUME}
          mainColor={previewColor}
        />
      </div>
    </div>
  );
}

// ── Main list ─────────────────────────────────────────────────────────────────

export function TemplateAdminList({ templates: initial }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/templates", { method: "PUT" });
      if (res.ok) router.refresh();
    } finally {
      setSeeding(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, isActive: !isActive } : t));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleThumbnailUpload = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append("thumbnail", file);
    const res = await fetch(`/api/admin/templates/${id}/thumbnail`, { method: "POST", body: fd });
    if (res.ok) {
      const { template } = await res.json();
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, thumbnail: template.thumbnail } : t));
    }
  };

  return (
    <div>
      {templates.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center mb-6">
          <Layers className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">No templates yet.</p>
          <p className="text-gray-500 text-sm mb-4">Seed the 8 built-in handcrafted templates to get started.</p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Seed built-in templates"}
          </button>
        </div>
      )}

      {templates.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Re-seed built-in templates"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className={cn(
              "bg-gray-900 border rounded-xl overflow-hidden flex flex-col",
              t.isActive ? "border-gray-800" : "border-gray-800 opacity-50",
            )}
          >
            {/* Thumbnail */}
            <div className="relative group shrink-0">
              {/* Prefer an uploaded thumbnail image */}
              {t.thumbnail ? (
                <div className="h-44 overflow-hidden">
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover object-top" />
                </div>
              ) : t.type === "ENGINE" && t.engineConfig ? (
                /* Live-rendered mini preview for ENGINE templates */
                <EngineTemplateThumbnail
                  engineConfig={t.engineConfig}
                  previewColor={t.previewColor}
                />
              ) : (
                /* Fallback colour swatch for HANDCRAFTED templates */
                <div className="h-44" style={{ backgroundColor: t.previewColor }} />
              )}

              {/* Upload overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-5 h-5 text-white" />
                  <span className="text-white text-[10px] font-medium">Upload thumbnail</span>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(t.id, f); }}
                />
              </label>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col flex-1 gap-2">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold text-white leading-tight">{t.name}</p>
                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0", TIER_COLORS[t.minTier])}>
                  {t.minTier}
                </span>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-medium",
                  t.type === "ENGINE" ? "bg-emerald-900 text-emerald-300" : "bg-sky-900 text-sky-300",
                )}>
                  {t.type}
                </span>
                <span className="text-gray-600 text-[9px]">#{t.displayOrder}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 mt-auto pt-1">
                <button
                  onClick={() => toggleActive(t.id, t.isActive)}
                  title={t.isActive ? "Deactivate" : "Activate"}
                  className={cn(
                    "flex-1 flex items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors",
                    t.isActive
                      ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      : "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900",
                  )}
                >
                  {t.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <a
                  href={`/admin/templates/${t.id}/edit`}
                  className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
