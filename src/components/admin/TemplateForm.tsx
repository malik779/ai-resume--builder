"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ChevronUp, ChevronDown, X, Plus } from "lucide-react";
import { TemplateIngestionPanel } from "./TemplateIngestionPanel";
import type { IngestionApplyPayload } from "./TemplateIngestionPanel";
import type { Template } from "@prisma/client";
import type {
  LayoutShell, LayoutVariant, HeaderPosition, SidebarAlign, SidebarStyle,
  SidebarBgMode, HeaderStyle, SectionStyle, EngineConfig,
} from "@/components/resume/templates/engine";
import {
  ALL_SECTION_KEYS,
  DEFAULT_MAIN_REGIONS,
  DEFAULT_SIDEBAR_REGIONS,
  DEFAULT_SINGLE_REGIONS,
} from "@/components/resume/templates/sections";
import { createEngineRenderer } from "@/components/resume/templates/EngineRenderer";
import type { TemplateProps } from "@/components/resume/templates/types";
import {
  SAMPLE_RESUME,
  PREVIEW_CSS_VARS,
  PREVIEW_TEMPLATE_PROPS,
} from "@/components/resume/templates/sample-resume";

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADER_STYLES  = ["stack-left","stack-center","split","banner-dark","banner-accent","two-tone","line-accent","underbar"];
const SECTION_STYLES = ["underline","overline","left-bar","filled","caps","flanked","badge","side-dot"];
const BULLET_CHARS   = ["•","▸","–","◆","→","▪","✦"];
const SIDEBAR_BGS    = ["dark-navy","dark-charcoal","dark-accent","light-gray","light-warm","light-accent"];
const TIERS          = ["FREE","BASIC","PRO","ENTERPRISE"];
const TAG_OPTIONS    = ["free","photo","two-column","ats"];

const SHELLS: { value: LayoutShell; label: string; desc: string; diagram: string }[] = [
  { value: "single",        label: "Single Column",  desc: "Full-width content",         diagram: "█████" },
  { value: "sidebar-left",  label: "Sidebar Left",   desc: "Sidebar · Main content",     diagram: "██░░░" },
  { value: "sidebar-right", label: "Sidebar Right",  desc: "Main content · Sidebar",     diagram: "░░░██" },
  { value: "two-column",    label: "Two Column",     desc: "Equal split, no background", diagram: "██░██" },
];

const SHELL_VARIANTS: Record<LayoutShell, { value: LayoutVariant; label: string; desc: string }[]> = {
  "single": [
    { value: "standard", label: "Standard",  desc: "Full width" },
    { value: "centered", label: "Centered",  desc: "Auto-margin center" },
  ],
  "sidebar-left": [
    { value: "full-height",   label: "Full Height",  desc: "Color fills height" },
    { value: "floating",      label: "Floating",     desc: "Raised card shadow" },
    { value: "header-hybrid", label: "Hybrid",       desc: "Bridge below header" },
    { value: "narrow-accent", label: "Narrow",       desc: "Thin accent strip" },
  ],
  "sidebar-right": [
    { value: "full-height",   label: "Full Height",  desc: "Color fills height" },
    { value: "floating",      label: "Floating",     desc: "Raised card shadow" },
    { value: "header-hybrid", label: "Hybrid",       desc: "Bridge below header" },
    { value: "narrow-accent", label: "Narrow",       desc: "Thin accent strip" },
  ],
  "two-column": [
    { value: "equal",          label: "Equal",        desc: "50 / 50 split" },
    { value: "main-heavy",     label: "Main Heavy",   desc: "65 / 35 emphasis" },
    { value: "sidebar-accent", label: "Accent Right", desc: "Accent bg on right" },
  ],
};

const DEFAULT_VARIANT: Record<LayoutShell, LayoutVariant> = {
  "single":        "standard",
  "sidebar-left":  "full-height",
  "sidebar-right": "full-height",
  "two-column":    "equal",
};

const SECTION_LABELS: Record<string, string> = {
  contact: "Contact", summary: "Summary", experience: "Experience",
  education: "Education", skills: "Skills", projects: "Projects",
  certifications: "Certifications", languages: "Languages",
};

// ── Region list editor ────────────────────────────────────────────────────────

function RegionList({
  label, sections, all, onChange,
}: {
  label: string;
  sections: string[];
  all: string[];
  onChange: (next: string[]) => void;
}) {
  const available = all.filter((k) => !sections.includes(k));

  const move = (i: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">{label}</div>
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-h-[80px]">
        {sections.length === 0 && (
          <p className="text-xs text-gray-600 p-3 text-center">No sections assigned</p>
        )}
        {sections.map((key, i) => (
          <div key={key} className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-700 last:border-b-0 group">
            <span className="flex-1 text-xs text-gray-200">{SECTION_LABELS[key] ?? key}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors">
              <ChevronUp className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1}
              className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors">
              <ChevronDown className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => onChange(sections.filter((_, j) => j !== i))}
              className="p-0.5 text-gray-600 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {available.map((key) => (
            <button key={key} type="button" onClick={() => onChange([...sections, key])}
              className="flex items-center gap-1 px-2 py-1 bg-gray-800 border border-dashed border-gray-700 rounded text-[10px] text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors">
              <Plus className="w-2.5 h-2.5" />
              {SECTION_LABELS[key] ?? key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props { template?: Template }

export function TemplateForm({ template }: Props) {
  const router  = useRouter();
  const isEdit  = !!template;
  const cfg     = (template?.engineConfig ?? {}) as Record<string, unknown>;
  const comp    = (cfg.composition ?? {}) as Record<string, unknown>;

  // Basic info
  const [name,         setName]         = useState(template?.name ?? "");
  const [slug,         setSlug]         = useState(template?.slug ?? "");
  const [description,  setDescription]  = useState(template?.description ?? "");
  const [previewColor, setPreviewColor] = useState(template?.previewColor ?? "#374151");
  const [minTier,      setMinTier]      = useState<"FREE"|"BASIC"|"PRO"|"ENTERPRISE">((template?.minTier as "FREE"|"BASIC"|"PRO"|"ENTERPRISE") ?? "FREE");
  const [tags,         setTags]         = useState<string[]>(template?.tags ?? []);
  const [displayOrder, setDisplayOrder] = useState(template?.displayOrder ?? 0);

  // Style config
  const [headerStyle,  setHeaderStyle]  = useState<string>((cfg.header  as string) ?? "stack-left");
  const [sectionStyle, setSectionStyle] = useState<string>((cfg.section as string) ?? "underline");
  const [bullet,       setBullet]       = useState<string>((cfg.bulletChar as string) ?? "•");
  const [uppercase,    setUppercase]    = useState<boolean>((cfg.uppercase as boolean) !== false);

  // Layout shell
  const existingShell = (cfg.shell as LayoutShell | undefined)
    ?? ((cfg.layout && cfg.layout !== "single")
        ? ((cfg.layout as { side: string }).side === "left" ? "sidebar-left" : "sidebar-right")
        : "single");
  const [shell, setShell] = useState<LayoutShell>(existingShell);

  // Layout variant
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>(
    (comp.layoutVariant as LayoutVariant | undefined) ?? DEFAULT_VARIANT[existingShell],
  );

  // Composition controls
  const [headerPosition, setHeaderPosition] = useState<HeaderPosition>(
    (comp.headerPosition as HeaderPosition | undefined) ?? "inline",
  );
  const [sidebarAlign, setSidebarAlign] = useState<SidebarAlign>(
    (comp.sidebarAlign as SidebarAlign | undefined) ?? "top",
  );
  const [sidebarStyle, setSidebarStyle] = useState<SidebarStyle>(
    (comp.sidebarStyle as SidebarStyle | undefined) ?? "solid",
  );

  // Sidebar config
  const existingSb = cfg.sidebar as { width?: number; bg?: string } | undefined;
  const [sidebarWidth, setSidebarWidth] = useState<number>(existingSb?.width ?? 30);
  const [sidebarBg,    setSidebarBg]    = useState<string>(existingSb?.bg ?? "dark-navy");

  // Regions
  const hasSidebar = shell === "sidebar-left" || shell === "sidebar-right" || shell === "two-column";
  const existingRegions = cfg.regions as { main?: string[]; sidebar?: string[] } | undefined;
  const [mainSections,    setMainSections]    = useState<string[]>(
    existingRegions?.main ?? (hasSidebar ? DEFAULT_MAIN_REGIONS : DEFAULT_SINGLE_REGIONS),
  );
  const [sidebarSections, setSidebarSections] = useState<string[]>(
    existingRegions?.sidebar ?? DEFAULT_SIDEBAR_REGIONS,
  );

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleIngestionApply = useCallback((p: IngestionApplyPayload) => {
    handleShellChange(p.shell);
    setHeaderStyle(p.header);
    setSectionStyle(p.section);
    setUppercase(p.uppercase);
    if (p.sidebarWidthPct != null) setSidebarWidth(p.sidebarWidthPct);
    if (p.sidebarBg)               setSidebarBg(p.sidebarBg);
    if (p.mainSections.length > 0) setMainSections(p.mainSections);
    if (p.sidebarSections && p.sidebarSections.length > 0) setSidebarSections(p.sidebarSections);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTag  = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  const autoSlug   = (v: string) =>
    v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleShellChange = (next: LayoutShell) => {
    setShell(next);
    setLayoutVariant(DEFAULT_VARIANT[next]);
    const nextHasSidebar = next === "sidebar-left" || next === "sidebar-right" || next === "two-column";
    if (nextHasSidebar && !hasSidebar) {
      setMainSections(DEFAULT_MAIN_REGIONS);
      setSidebarSections(DEFAULT_SIDEBAR_REGIONS);
    } else if (!nextHasSidebar && hasSidebar) {
      setMainSections(DEFAULT_SINGLE_REGIONS);
      setSidebarSections([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const currentHasSidebar = shell === "sidebar-left" || shell === "sidebar-right" || shell === "two-column";

    const engineConfig: Record<string, unknown> = {
      header:     headerStyle,
      section:    sectionStyle,
      bulletChar: bullet,
      uppercase,
      shell,
      regions: {
        main:    mainSections,
        ...(currentHasSidebar && { sidebar: sidebarSections }),
      },
      composition: {
        layoutVariant,
        headerPosition,
        ...(currentHasSidebar && shell !== "two-column" && {
          sidebarAlign,
          sidebarStyle,
        }),
      },
    };

    if (currentHasSidebar && shell !== "two-column") {
      engineConfig.sidebar = { width: sidebarWidth, bg: sidebarBg };
    }

    const payload = {
      slug:        isEdit ? template.slug : slug,
      name,
      description,
      type:        "ENGINE",
      engineConfig,
      previewColor,
      tags,
      minTier,
      displayOrder,
    };

    const res = isEdit
      ? await fetch(`/api/admin/templates/${template.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/templates",                { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Save failed");
      setSaving(false);
      return;
    }

    router.push("/admin/templates");
    router.refresh();
  };

  const currentHasSidebar = shell === "sidebar-left" || shell === "sidebar-right" || shell === "two-column";
  const isSidebarShell    = shell === "sidebar-left" || shell === "sidebar-right";
  const sidebarLabel      = shell === "two-column" ? "Right column" : "Sidebar";
  const allKeys           = [...ALL_SECTION_KEYS];
  const variantOptions    = SHELL_VARIANTS[shell];

  // Derive live config for preview
  const liveConfig = useMemo<EngineConfig>(() => {
    const c: EngineConfig = {
      header:     headerStyle as HeaderStyle,
      section:    sectionStyle as SectionStyle,
      bulletChar: bullet,
      uppercase,
      shell,
      regions: {
        main: mainSections,
        ...(currentHasSidebar ? { sidebar: sidebarSections } : {}),
      },
      composition: {
        layoutVariant,
        headerPosition,
        ...(isSidebarShell ? { sidebarAlign, sidebarStyle } : {}),
      },
    };
    if (currentHasSidebar && shell !== "two-column") {
      c.sidebar = { width: sidebarWidth, bg: sidebarBg as SidebarBgMode };
    }
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shell, layoutVariant, headerPosition, sidebarAlign, sidebarStyle,
      headerStyle, sectionStyle, bullet, uppercase, sidebarWidth, sidebarBg,
      JSON.stringify(mainSections), JSON.stringify(sidebarSections)]);

  const PreviewComponent = useMemo(
    () => createEngineRenderer(liveConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(liveConfig)],
  );

  return (
    <div className="flex gap-8 items-start">
    {/* ── Left: scrollable form ── */}
    <div className="flex-1 min-w-0 space-y-8">
    <TemplateIngestionPanel onApply={handleIngestionApply} />
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Basic info ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Basic Info</h2>

        <Field label="Template Name">
          <input value={name} onChange={(e) => { setName(e.target.value); if (!isEdit) setSlug(autoSlug(e.target.value)); }}
            required placeholder="e.g. Dark Executive Pro" className={INPUT} />
        </Field>

        {!isEdit && (
          <Field label="Slug" hint="Unique ID — lowercase, hyphens only">
            <input value={slug} onChange={(e) => setSlug(autoSlug(e.target.value))} required placeholder="dark-executive-pro" className={INPUT} />
          </Field>
        )}

        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description shown in template picker" className={INPUT} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Preview Color">
            <div className="flex items-center gap-2">
              <input type="color" value={previewColor} onChange={(e) => setPreviewColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-gray-400 text-sm font-mono">{previewColor}</span>
            </div>
          </Field>
          <Field label="Min Tier">
            <select value={minTier} onChange={(e) => setMinTier(e.target.value as "FREE"|"BASIC"|"PRO"|"ENTERPRISE")} className={SELECT}>
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
                  tags.includes(tag) ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500")}>
                {tag}
              </button>
            ))}
          </div>
        </Field>
      </section>

      {/* ── Layout shell ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Layout Shell</h2>

        {/* Shell picker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SHELLS.map((s) => (
            <button key={s.value} type="button" onClick={() => handleShellChange(s.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                shell === s.value ? "border-violet-500 bg-violet-900/20" : "border-gray-700 hover:border-gray-600",
              )}>
              <span className="font-mono text-lg tracking-widest text-gray-300">{s.diagram}</span>
              <span className="text-xs font-semibold text-white">{s.label}</span>
              <span className="text-[10px] text-gray-500">{s.desc}</span>
            </button>
          ))}
        </div>

        {/* Layout variant picker */}
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2">Layout Variant</div>
          <div className="flex gap-2 flex-wrap">
            {variantOptions.map((v) => (
              <button key={v.value} type="button" onClick={() => setLayoutVariant(v.value)}
                className={cn(
                  "flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left",
                  layoutVariant === v.value
                    ? "border-violet-500 bg-violet-900/20"
                    : "border-gray-700 hover:border-gray-600",
                )}>
                <span className="text-xs font-semibold text-white">{v.label}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">{v.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar dimensions — sidebar shells only */}
        {currentHasSidebar && shell !== "two-column" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sidebar Width (%)" hint="20–45 recommended">
              <input type="number" min={15} max={50} value={sidebarWidth}
                onChange={(e) => setSidebarWidth(Number(e.target.value))} className={INPUT} />
            </Field>
            <Field label="Sidebar Background">
              <select value={sidebarBg} onChange={(e) => setSidebarBg(e.target.value)} className={SELECT}>
                {SIDEBAR_BGS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>
        )}
      </section>

      {/* ── Composition controls ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Composition</h2>
          <p className="text-xs text-gray-500 mt-1">Fine-tune layout behaviour beyond the shell choice.</p>
        </div>

        {/* Header Position */}
        <Field label="Header Position">
          <div className="flex gap-2">
            {(["inline", "full-width"] as HeaderPosition[]).map((v) => (
              <button key={v} type="button" onClick={() => setHeaderPosition(v)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-xs font-medium transition-all",
                  headerPosition === v
                    ? "border-violet-500 bg-violet-900/20 text-violet-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-600",
                )}>
                {v === "inline" ? "Inline" : "Full Width"}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-1">
            {headerPosition === "full-width"
              ? "Header spans the full page width (overrides sidebar column)"
              : "Header stays within the column layout"}
          </p>
        </Field>

        {/* Sidebar-only controls */}
        {isSidebarShell && (
          <>
            <Field label="Sidebar Vertical Align">
              <div className="flex gap-2">
                {(["top", "center", "stretch"] as SidebarAlign[]).map((v) => (
                  <button key={v} type="button" onClick={() => setSidebarAlign(v)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-xs font-medium transition-all capitalize",
                      sidebarAlign === v
                        ? "border-violet-500 bg-violet-900/20 text-violet-300"
                        : "border-gray-700 text-gray-400 hover:border-gray-600",
                    )}>
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                {sidebarAlign === "center"  ? "Content vertically centered in sidebar" :
                 sidebarAlign === "stretch" ? "Content spread from top to bottom" :
                 "Content anchored to the top"}
              </p>
            </Field>

            <Field label="Sidebar Style">
              <div className="flex gap-2">
                {(["solid", "card", "minimal"] as SidebarStyle[]).map((v) => (
                  <button key={v} type="button" onClick={() => setSidebarStyle(v)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-xs font-medium transition-all capitalize",
                      sidebarStyle === v
                        ? "border-violet-500 bg-violet-900/20 text-violet-300"
                        : "border-gray-700 text-gray-400 hover:border-gray-600",
                    )}>
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                {sidebarStyle === "card"    ? "Rounded card with shadow" :
                 sidebarStyle === "minimal" ? "Transparent bg with accent border" :
                 "Filled accent background"}
              </p>
            </Field>
          </>
        )}
      </section>

      {/* ── Region assignment ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Section Regions</h2>
          <p className="text-xs text-gray-500 mt-1">
            Assign resume sections to layout regions. Order within each region controls display order.
          </p>
        </div>

        <div className={cn("flex gap-4", currentHasSidebar ? "flex-row" : "flex-col")}>
          <RegionList
            label={currentHasSidebar ? "Main column" : "All sections"}
            sections={mainSections}
            all={allKeys}
            onChange={setMainSections}
          />
          {currentHasSidebar && (
            <RegionList
              label={sidebarLabel}
              sections={sidebarSections}
              all={allKeys}
              onChange={setSidebarSections}
            />
          )}
        </div>
      </section>

      {/* ── Visual styles ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Visual Styles</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Header Style">
            <select value={headerStyle} onChange={(e) => setHeaderStyle(e.target.value)} className={SELECT}>
              {HEADER_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Section Title Style">
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
                  bullet === b ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-300 hover:border-gray-500")}>
                {b}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Section Title Case">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="w-4 h-4 accent-violet-600" />
            <span className="text-sm text-gray-300">Uppercase section titles</span>
          </label>
        </Field>
      </section>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create template"}
        </button>
        <a href="/admin/templates" className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors">
          Cancel
        </a>
      </div>
    </form>
    </div>

    {/* ── Right: sticky live preview ── */}
    <div className="sticky top-8 shrink-0 w-[560px]">
      <LivePreviewPane PreviewComponent={PreviewComponent} mainColor={previewColor} />
    </div>
    </div>
  );
}

// ── Live preview pane ─────────────────────────────────────────────────────────

const TEMPLATE_W = 794;
const PANE_W     = 560;
const SCALE      = PANE_W / TEMPLATE_W;
const PANE_H     = Math.round(1123 * SCALE);

function LivePreviewPane({
  PreviewComponent,
  mainColor,
}: {
  PreviewComponent: React.FC<TemplateProps>;
  mainColor: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</span>
        <span className="text-[10px] text-gray-600">Sample data · {Math.round(SCALE * 100)}% scale</span>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-gray-700 shadow-xl"
        style={{ width: PANE_W, height: PANE_H, position: "relative" }}
      >
        <div style={{
          ...PREVIEW_CSS_VARS,
          width:           TEMPLATE_W,
          transformOrigin: "top left",
          transform:       `scale(${SCALE})`,
          position:        "absolute",
          top: 0, left: 0,
          background: "white",
          overflow: "hidden",
        }}>
          <PreviewComponent
            {...PREVIEW_TEMPLATE_PROPS}
            resume={SAMPLE_RESUME}
            mainColor={mainColor}
          />
        </div>
      </div>

      <p className="text-[10px] text-gray-600 mt-2 text-center">
        Preview uses sample data. Actual resume content may differ.
      </p>
    </div>
  );
}

// ── Shared field helpers ──────────────────────────────────────────────────────

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
