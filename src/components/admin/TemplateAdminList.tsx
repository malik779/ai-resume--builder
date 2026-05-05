"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Edit, Trash2, ImagePlus, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Template } from "@prisma/client";

interface Props {
  templates: Template[];
}

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-gray-700 text-gray-300",
  BASIC: "bg-blue-900 text-blue-300",
  PRO: "bg-violet-900 text-violet-300",
  ENTERPRISE: "bg-amber-900 text-amber-300",
};

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

      <div className="grid grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.id} className={cn("bg-gray-900 border rounded-xl overflow-hidden", t.isActive ? "border-gray-800" : "border-gray-800 opacity-60")}>
            {/* Thumbnail */}
            <div className="relative aspect-[210/297] bg-gray-800 group">
              {t.thumbnail ? (
                <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: t.previewColor }}>
                    <span className="text-white text-sm font-bold">{t.name[0]}</span>
                  </div>
                  <span className="text-gray-500 text-xs">No thumbnail</span>
                </div>
              )}
              {/* Upload overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-6 h-6 text-white" />
                  <span className="text-white text-xs font-medium">Upload thumbnail</span>
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
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold shrink-0", TIER_COLORS[t.minTier])}>
                  {t.minTier}
                </span>
              </div>

              {/* Tags */}
              {t.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2 mb-3">
                  {t.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-[10px] rounded font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Type badge */}
              <div className="flex items-center gap-1 mb-3">
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", t.type === "ENGINE" ? "bg-emerald-900 text-emerald-300" : "bg-sky-900 text-sky-300")}>
                  {t.type}
                </span>
                <span className="text-gray-600 text-[10px]">#{t.displayOrder}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(t.id, t.isActive)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    t.isActive
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900"
                  )}
                >
                  {t.isActive ? <><EyeOff className="w-3.5 h-3.5" /> Deactivate</> : <><Eye className="w-3.5 h-3.5" /> Activate</>}
                </button>
                <a
                  href={`/admin/templates/${t.id}/edit`}
                  className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
