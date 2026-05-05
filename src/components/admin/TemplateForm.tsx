"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { Template } from "@prisma/client";

const HEADER_STYLES = ["stack-left", "stack-center", "split", "banner-dark", "banner-accent", "two-tone", "line-accent", "underbar"];
const SECTION_STYLES = ["underline", "overline", "left-bar", "filled", "caps", "flanked", "badge", "side-dot"];
const BULLET_CHARS   = ["•", "▸", "–", "◆", "→", "▪", "✦"];
const SIDEBAR_SIDES  = [{ value: "", label: "None" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }];
const SIDEBAR_BGS    = ["dark-navy", "dark-accent", "dark-gray", "light-gray", "white", "accent-tint"];
const TIERS          = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
const TAG_OPTIONS    = ["free", "photo", "two-column", "ats"];

interface Props {
  template?: Template;
}

export function TemplateForm({ template }: Props) {
  const router = useRouter();
  const isEdit = !!template;
  const cfg = (template?.engineConfig ?? {}) as Record<string, unknown>;

  const [name, setName]               = useState(template?.name ?? "");
  const [slug, setSlug]               = useState(template?.slug ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [previewColor, setPreviewColor] = useState(template?.previewColor ?? "#374151");
  const [minTier, setMinTier]         = useState<"FREE" | "BASIC" | "PRO" | "ENTERPRISE">((template?.minTier as "FREE" | "BASIC" | "PRO" | "ENTERPRISE") ?? "FREE");
  const [tags, setTags]               = useState<string[]>(template?.tags ?? []);
  const [displayOrder, setDisplayOrder] = useState(template?.displayOrder ?? 0);
  // Engine config fields
  const [headerStyle, setHeaderStyle] = useState<string>((cfg.header as string) ?? "stack-left");
  const [sectionStyle, setSectionStyle] = useState<string>((cfg.section as string) ?? "underline");
  const [bullet, setBullet]           = useState<string>((cfg.bullet as string) ?? "•");
  const [hasPhoto, setHasPhoto]       = useState<boolean>(!!(cfg as { photo?: boolean }).photo);
  const [sidebarSide, setSidebarSide] = useState<string>((cfg as { sidebar?: { side?: string } }).sidebar?.side ?? "");
  const [sidebarWidth, setSidebarWidth] = useState<number>((cfg as { sidebar?: { width?: number } }).sidebar?.width ?? 30);
  const [sidebarBg, setSidebarBg]     = useState<string>((cfg as { sidebar?: { bg?: string } }).sidebar?.bg ?? "dark-navy");

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const toggleTag = (tag: string) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const autoSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const engineConfig: Record<string, unknown> = { header: headerStyle, section: sectionStyle, bullet };
    if (hasPhoto) engineConfig.photo = true;
    if (sidebarSide) engineConfig.sidebar = { side: sidebarSide, width: sidebarWidth, bg: sidebarBg };

    const payload = {
      slug: isEdit ? template.slug : slug,
      name,
      description,
      type: "ENGINE",
      engineConfig,
      previewColor,
      tags,
      minTier,
      displayOrder,
    };

    const res = isEdit
      ? await fetch(`/api/admin/templates/${template.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/templates",                 { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Save failed");
      setSaving(false);
      return;
    }

    router.push("/admin/templates");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Basic Info</h2>

        <Field label="Template Name">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); if (!isEdit) setSlug(autoSlug(e.target.value)); }}
            required
            placeholder="e.g. Dark Executive Pro"
            className={INPUT}
          />
        </Field>

        {!isEdit && (
          <Field label="Slug" hint="Used as the template ID — lowercase, hyphen-only">
            <input value={slug} onChange={(e) => setSlug(autoSlug(e.target.value))} required placeholder="dark-executive-pro" className={INPUT} />
          </Field>
        )}

        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One-liner shown in the template picker" className={INPUT} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Preview Color">
            <div className="flex items-center gap-2">
              <input type="color" value={previewColor} onChange={(e) => setPreviewColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-gray-400 text-sm font-mono">{previewColor}</span>
            </div>
          </Field>
          <Field label="Min Tier">
            <select value={minTier} onChange={(e) => setMinTier(e.target.value as "FREE" | "BASIC" | "PRO" | "ENTERPRISE")} className={SELECT}>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Display Order">
            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className={INPUT} />
          </Field>
        </div>

        <Field label="Tags">
          <div className="flex gap-2 flex-wrap">
            {TAG_OPTIONS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  tags.includes(tag) ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
                )}>
                {tag}
              </button>
            ))}
          </div>
        </Field>
      </section>

      {/* Engine config */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Layout Engine Config</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Header Style">
            <select value={headerStyle} onChange={(e) => setHeaderStyle(e.target.value)} className={SELECT}>
              {HEADER_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Section Style">
            <select value={sectionStyle} onChange={(e) => setSectionStyle(e.target.value)} className={SELECT}>
              {SECTION_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Bullet Character">
          <div className="flex gap-2 flex-wrap">
            {BULLET_CHARS.map((b) => (
              <button key={b} type="button" onClick={() => setBullet(b)}
                className={cn("w-9 h-9 rounded-lg border text-base font-mono transition-colors",
                  bullet === b ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-300 hover:border-gray-500"
                )}>
                {b}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Photo Support">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasPhoto} onChange={(e) => setHasPhoto(e.target.checked)} className="w-4 h-4 accent-violet-600" />
            <span className="text-sm text-gray-300">Show profile photo placeholder</span>
          </label>
        </Field>

        <div className="border-t border-gray-800 pt-4 space-y-4">
          <Field label="Sidebar">
            <div className="flex gap-2">
              {SIDEBAR_SIDES.map((s) => (
                <button key={s.value} type="button" onClick={() => setSidebarSide(s.value)}
                  className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                    sidebarSide === s.value ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          {sidebarSide && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sidebar Width (%)" hint="20–45 recommended">
                <input type="number" min={15} max={50} value={sidebarWidth} onChange={(e) => setSidebarWidth(Number(e.target.value))} className={INPUT} />
              </Field>
              <Field label="Sidebar Background">
                <select value={sidebarBg} onChange={(e) => setSidebarBg(e.target.value)} className={SELECT}>
                  {SIDEBAR_BGS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
      </section>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create template"}
        </button>
        <a href="/admin/templates" className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}

const INPUT  = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500";
const SELECT = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-violet-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label}
        {hint && <span className="ml-1 text-gray-600 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
