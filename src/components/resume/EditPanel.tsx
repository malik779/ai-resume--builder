"use client";

import { useState, useMemo } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { SummarySection } from "./sections/SummarySection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection } from "./sections/SkillsSection";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronUp, GripVertical, Sparkles, Plus, X } from "lucide-react";
import type { Resume, Language, Certification } from "@/types/resume";

// ─── Completeness (strict: only count truly non-empty required fields) ────────

function computeCompleteness(resume: Resume | null) {
  const scores = { personal: 0, summary: 0, experience: 0, education: 0, skills: 0 };
  if (!resume) return { total: 0, scores };

  const pi = resume.personalInfo ?? {};
  // Required minimum: firstName, lastName, email
  const req = [pi.firstName?.trim(), pi.lastName?.trim(), pi.email?.trim()].filter(Boolean).length;
  // Optional extras
  const opt = [pi.headline?.trim(), pi.phone?.trim(), pi.location?.trim()].filter(Boolean).length;
  scores.personal = Math.round((req / 3) * 15 + (opt / 3) * 10); // max 25

  const sumLen = (resume.summary ?? "").trim().length;
  if (sumLen >= 80) scores.summary = 15;
  else if (sumLen >= 20) scores.summary = 7;

  // Count only experiences that have at least a title or company
  const validExp = (resume.experiences ?? []).filter(
    (e) => e.title?.trim() || e.company?.trim()
  );
  if (validExp.length > 0) {
    const withBullets = validExp.filter((e) => (e.bullets?.length ?? 0) >= 2).length;
    scores.experience = Math.min(30, 10 + validExp.length * 3 + withBullets * 4);
  }

  const validEdu = (resume.educations ?? []).filter(
    (e) => e.institution?.trim() || e.degree?.trim()
  );
  if (validEdu.length > 0) scores.education = 15;

  const validSkills = (resume.skills ?? []).filter((s) => s.name?.trim()).length;
  if (validSkills >= 5) scores.skills = 10;
  else if (validSkills > 0) scores.skills = Math.round(validSkills * 2);

  const total = Math.min(100, Object.values(scores).reduce((a, b) => a + b, 0));
  return { total, scores };
}

// Strict "done" check per section (required fields only)
function isSectionDone(id: CoreSection, resume: Resume | null): boolean {
  if (!resume) return false;
  const pi = resume.personalInfo ?? {};
  switch (id) {
    case "personal":
      return !!(pi.firstName?.trim() && pi.lastName?.trim() && pi.email?.trim());
    case "summary":
      return (resume.summary ?? "").trim().length >= 80;
    case "experience":
      return (resume.experiences ?? []).some(
        (e) => e.title?.trim() && e.company?.trim() && (e.bullets?.length ?? 0) >= 1
      );
    case "education":
      return (resume.educations ?? []).some(
        (e) => e.institution?.trim() && e.degree?.trim()
      );
    case "skills":
      return (resume.skills ?? []).filter((s) => s.name?.trim()).length >= 5;
  }
}

// ─── Section types ─────────────────────────────────────────────────────────

type CoreSection = "personal" | "summary" | "experience" | "education" | "skills";
type DynamicSection = "languages" | "certifications" | "volunteering" | "hobbies" | "awards" | "publications";

const CORE_SECTIONS: { id: CoreSection; label: string; maxScore: number }[] = [
  { id: "personal",   label: "Personal Details",        maxScore: 25 },
  { id: "summary",    label: "Professional Summary",    maxScore: 15 },
  { id: "experience", label: "Professional Experience", maxScore: 30 },
  { id: "education",  label: "Education",               maxScore: 15 },
  { id: "skills",     label: "Areas of Expertise",      maxScore: 10 },
];

const ADDABLE_SECTIONS: { id: DynamicSection; label: string; icon: string; pro?: boolean }[] = [
  { id: "languages",      label: "Languages",      icon: "🌐" },
  { id: "certifications", label: "Certifications", icon: "🏅" },
  { id: "volunteering",   label: "Volunteering",   icon: "🤝" },
  { id: "hobbies",        label: "Hobbies",        icon: "⭐" },
  { id: "awards",         label: "Awards",         icon: "🏆" },
  { id: "publications",   label: "Publications",   icon: "📄", pro: true },
];

// ─── Dynamic section forms ─────────────────────────────────────────────────

function LanguagesForm() {
  const { resume, setLanguages } = useResumeStore();
  const languages = resume?.languages ?? [];

  const add = () => setLanguages([...languages, { name: "", proficiency: "conversational" }]);
  const update = (i: number, data: Partial<Language>) => {
    const next = [...languages];
    next[i] = { ...next[i], ...data };
    setLanguages(next);
  };
  const remove = (i: number) => setLanguages(languages.filter((_, idx) => idx !== i));

  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="space-y-2">
      {languages.map((lang, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={lang.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="e.g. Spanish"
            className={cn(inputCls, "flex-1")}
          />
          <select
            value={lang.proficiency}
            onChange={(e) => update(i, { proficiency: e.target.value as Language["proficiency"] })}
            className="rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="basic">Basic</option>
            <option value="conversational">Conversational</option>
            <option value="professional">Professional</option>
            <option value="native">Native</option>
          </select>
          <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
      >
        <Plus className="h-3.5 w-3.5" /> Add Language
      </button>
    </div>
  );
}

function CertificationsForm() {
  const { resume, setCertifications } = useResumeStore();
  const certs = resume?.certifications ?? [];

  const add = () => setCertifications([...certs, { name: "", issuer: "" }]);
  const update = (i: number, data: Partial<Certification>) => {
    const next = [...certs];
    next[i] = { ...next[i], ...data };
    setCertifications(next);
  };
  const remove = (i: number) => setCertifications(certs.filter((_, idx) => idx !== i));

  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="space-y-3">
      {certs.map((cert, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
          <button
            onClick={() => remove(i)}
            className="absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <input value={cert.name} onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Certification name" className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <input value={cert.issuer} onChange={(e) => update(i, { issuer: e.target.value })}
              placeholder="Issuer / Organization" className={inputCls} />
            <input value={cert.date ?? ""} onChange={(e) => update(i, { date: e.target.value })}
              placeholder="Date (e.g. Jan 2024)" className={inputCls} />
          </div>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
        <Plus className="h-3.5 w-3.5" /> Add Certification
      </button>
    </div>
  );
}

function SimpleTextForm({ placeholder }: { placeholder: string }) {
  return (
    <textarea
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
    />
  );
}

// ─── Section accordion item ────────────────────────────────────────────────

interface SectionAccordionProps {
  id: CoreSection | DynamicSection;
  label: string;
  score?: number;
  maxScore?: number;
  done?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  resumeId: string;
  onRemove?: () => void;
  children?: React.ReactNode;
}

function SectionAccordion({
  id, label, score = 0, maxScore = 0, done = false,
  isOpen, onToggle,
  isDragging, isDragOver,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  resumeId, onRemove, children,
}: SectionAccordionProps) {
  const showBadge = score > 0 || done;

  return (
    <div
      id={`section-${id}`}
      className={cn(
        "border-b border-gray-100 last:border-b-0 transition-colors",
        isDragging && "opacity-40",
        isDragOver && "border-t-2 border-blue-500 bg-blue-50/40"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-4 py-3.5">
        {/* Drag handle — only this element is draggable */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", id);
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-gray-100 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-gray-300" />
        </div>

        {/* Toggle — everything else */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{label}</span>
          {showBadge && (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap",
              done
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-600"
            )}>
              {done ? "✓ Done" : `+${maxScore - score}%`}
            </span>
          )}
          {isOpen
            ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
            : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          }
        </button>

        {/* Remove button for dynamic sections */}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="shrink-0 text-gray-300 hover:text-red-400 p-0.5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-5 pt-1">
          {children ?? (
            <>
              {id === "personal"   && <PersonalInfoSection />}
              {id === "summary"    && <SummarySection resumeId={resumeId} />}
              {id === "experience" && <ExperienceSection resumeId={resumeId} />}
              {id === "education"  && <EducationSection resumeId={resumeId} />}
              {id === "skills"     && <SkillsSection resumeId={resumeId} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface EditPanelProps {
  resumeId: string;
  onOpenAIWriter: (context?: string) => void;
}

type AnySection = CoreSection | DynamicSection;

export function EditPanel({ resumeId, onOpenAIWriter }: EditPanelProps) {
  const { resume, setSectionOrder } = useResumeStore();

  // Section order — core sections always present, dynamic sections appended
  const [coreOrder, setCoreOrder] = useState<CoreSection[]>(CORE_SECTIONS.map((s) => s.id));
  const [dynamicOrder, setDynamicOrder] = useState<DynamicSection[]>([]);
  const [openSections, setOpenSections] = useState<Set<AnySection>>(new Set(["personal"]));

  // Drag state
  const [draggedId, setDraggedId] = useState<AnySection | null>(null);
  const [dragOverId, setDragOverId] = useState<AnySection | null>(null);

  const { total, scores } = useMemo(() => computeCompleteness(resume), [resume]);

  const toggle = (id: AnySection) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const jumpTo = (id: AnySection) => {
    setOpenSections((prev) => new Set([...prev, id]));
    setTimeout(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const addDynamicSection = (id: DynamicSection) => {
    if (dynamicOrder.includes(id)) { jumpTo(id); return; }
    setDynamicOrder((prev) => [...prev, id]);
    setOpenSections((prev) => new Set([...prev, id]));
    setTimeout(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const removeDynamicSection = (id: DynamicSection) => {
    setDynamicOrder((prev) => prev.filter((s) => s !== id));
    setOpenSections((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  // Drop handler — works for both core and dynamic sections
  const handleDrop = (targetId: AnySection) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain") as AnySection;
    if (!fromId || fromId === targetId) { setDragOverId(null); setDraggedId(null); return; }

    // Core ↔ Core reorder
    if (coreOrder.includes(fromId as CoreSection) && coreOrder.includes(targetId as CoreSection)) {
      const next = [...coreOrder];
      const fi = next.indexOf(fromId as CoreSection);
      const ti = next.indexOf(targetId as CoreSection);
      next.splice(fi, 1);
      next.splice(ti, 0, fromId as CoreSection);
      setCoreOrder(next);
      // Sync to template — "personal" is always the header, skip it
      setSectionOrder(next.filter((id) => id !== "personal"));
    }
    // Dynamic ↔ Dynamic reorder
    if (dynamicOrder.includes(fromId as DynamicSection) && dynamicOrder.includes(targetId as DynamicSection)) {
      setDynamicOrder((prev) => {
        const next = [...prev];
        const fi = next.indexOf(fromId as DynamicSection);
        const ti = next.indexOf(targetId as DynamicSection);
        next.splice(fi, 1);
        next.splice(ti, 0, fromId as DynamicSection);
        return next;
      });
    }
    setDragOverId(null);
    setDraggedId(null);
  };

  const dragProps = (id: AnySection) => ({
    isDragging: draggedId === id,
    isDragOver: dragOverId === id && draggedId !== id,
    onDragStart: () => setDraggedId(id),
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId && draggedId !== id) setDragOverId(id); },
    onDragLeave: () => setDragOverId(null),
    onDrop: handleDrop(id),
  });

  // Suggestion chips
  const chips: { label: string; color: "purple" | "green" | "blue"; action: () => void }[] = [];
  if (!resume?.summary || (resume.summary ?? "").trim().length < 30)
    chips.push({ label: "✦ AI profile summary", color: "purple", action: () => onOpenAIWriter("Write a compelling professional summary for my resume") });
  if (!(resume?.educations ?? []).some((e) => e.institution?.trim() || e.degree?.trim()))
    chips.push({ label: "+15 Add education", color: "green", action: () => jumpTo("education") });
  if ((resume?.skills ?? []).filter((s) => s.name?.trim()).length < 5)
    chips.push({ label: "+10 Add skills", color: "blue", action: () => jumpTo("skills") });

  const barColor = total >= 80 ? "#16a34a" : total >= 50 ? "#d97706" : "#dc2626";
  const badgeClass = total >= 80 ? "bg-green-100 text-green-700" : total >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  const getDynamicLabel = (id: DynamicSection) =>
    ADDABLE_SECTIONS.find((s) => s.id === id)?.label ?? id;

  const getDynamicForm = (id: DynamicSection) => {
    if (id === "languages") return <LanguagesForm />;
    if (id === "certifications") return <CertificationsForm />;
    if (id === "hobbies") return <SimpleTextForm placeholder="e.g. Photography, Hiking, Open-source development, Chess..." />;
    if (id === "volunteering") return <SimpleTextForm placeholder="Organization, role, dates, and what you contributed..." />;
    if (id === "awards") return <SimpleTextForm placeholder="Award name, issuer, year, and a brief description..." />;
    return <SimpleTextForm placeholder="Enter your content here..." />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Completeness bar ─────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600">Resume completeness</span>
          <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", badgeClass)}>
            {total}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${total}%`, backgroundColor: barColor }}
          />
        </div>

        {chips.length > 0 && (
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.action}
                className={cn(
                  "shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap transition-all",
                  chip.color === "purple" && "border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100",
                  chip.color === "green"  && "border-green-200 text-green-700 bg-green-50 hover:bg-green-100",
                  chip.color === "blue"   && "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Section accordion (scrollable) ───────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Core sections (draggable & reorderable) */}
        {coreOrder.map((id) => {
          const meta = CORE_SECTIONS.find((s) => s.id === id)!;
          const score = scores[id];
          const done = isSectionDone(id, resume);
          return (
            <SectionAccordion
              key={id}
              id={id}
              label={meta.label}
              score={score}
              maxScore={meta.maxScore}
              done={done}
              isOpen={openSections.has(id)}
              onToggle={() => toggle(id)}
              resumeId={resumeId}
              {...dragProps(id)}
            />
          );
        })}

        {/* Dynamic sections (added via "Add Section") */}
        {dynamicOrder.map((id) => (
          <SectionAccordion
            key={id}
            id={id}
            label={getDynamicLabel(id)}
            isOpen={openSections.has(id)}
            onToggle={() => toggle(id)}
            resumeId={resumeId}
            onRemove={() => removeDynamicSection(id)}
            {...dragProps(id)}
          >
            {getDynamicForm(id)}
          </SectionAccordion>
        ))}

        {/* ── Add Section grid ──────────────────────────────── */}
        <div className="px-4 py-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Add Section</p>
          <div className="grid grid-cols-2 gap-2">
            {ADDABLE_SECTIONS.map((item) => {
              const already = dynamicOrder.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => !item.pro && addDynamicSection(item.id)}
                  disabled={item.pro}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-xs text-left transition-all",
                    item.pro
                      ? "border-gray-100 text-gray-300 cursor-not-allowed"
                      : already
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
                  )}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="leading-tight">{item.label}</span>
                  {item.pro && (
                    <span className="ml-auto text-[9px] font-bold text-gray-300 border border-gray-200 px-1 rounded">PRO</span>
                  )}
                  {already && !item.pro && (
                    <span className="ml-auto text-[10px] text-green-600">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Ask AI writer — pinned footer ─────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
        <button
          onClick={() => onOpenAIWriter()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          ✦ Ask AI writer
        </button>
      </div>
    </div>
  );
}
