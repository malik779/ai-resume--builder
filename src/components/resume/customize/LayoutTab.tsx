"use client";

import { useCustomizeStore, type DateFormat } from "@/stores/customize.store";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils/cn";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-5 mb-2">{children}</p>;
}

function Select({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 border border-gray-200 rounded-md text-xs px-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function VisualOption({ label, selected, onClick, children }: {
  label: string; selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-full",
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="w-full h-12 flex items-center justify-center">{children}</div>
      <span className={cn("text-[10px] font-medium", selected ? "text-blue-600" : "text-gray-500")}>{label}</span>
    </button>
  );
}

export function LayoutTab() {
  const { layout, updateLayout, resetLayout } = useCustomizeStore();

  return (
    <div className="flex flex-col h-full overflow-auto px-4 py-4 space-y-1">
      <SectionLabel>Format</SectionLabel>
      <Select
        label="Page Size"
        value={layout.format}
        onChange={(v) => updateLayout({ format: v as "A4" | "US_LETTER" })}
        options={[{ value: "A4", label: "A4 (210 × 297 mm)" }, { value: "US_LETTER", label: "US Letter (8.5\" × 11\")" }]}
      />

      <SectionLabel>Margins & Spacing</SectionLabel>
      <Slider label="Top & Bottom" min={0.1} max={1.5} step={0.05} value={layout.topBottom} onChange={(v) => updateLayout({ topBottom: v })} unit=" in" decimals={2} />
      <Slider label="Left & Right" min={0.1} max={1.5} step={0.05} value={layout.leftRight} onChange={(v) => updateLayout({ leftRight: v })} unit=" in" decimals={2} />
      <Slider label="Between Sections" min={4} max={32} value={layout.betweenSections} onChange={(v) => updateLayout({ betweenSections: v })} unit=" pt" />
      <Slider label="Title → Content Gap" min={2} max={16} value={layout.betweenTitlesContent} onChange={(v) => updateLayout({ betweenTitlesContent: v })} unit=" pt" />
      <Slider label="Between Content Blocks" min={2} max={16} value={layout.betweenContentBlocks} onChange={(v) => updateLayout({ betweenContentBlocks: v })} unit=" pt" />
      <Slider label="Inside Content Block" min={1} max={8} value={layout.insideContentBlock} onChange={(v) => updateLayout({ insideContentBlock: v })} unit=" pt" />

      <SectionLabel>Date Format</SectionLabel>
      <Select
        label="Date Style"
        value={layout.dateFormat}
        onChange={(v) => updateLayout({ dateFormat: v as DateFormat })}
        options={[
          { value: "short",   label: "Short Name (Jan 2024)" },
          { value: "long",    label: "Long Name (January 2024)" },
          { value: "numeric", label: "Numbers (01/2024)" },
          { value: "year",    label: "Year Only (2024)" },
        ]}
      />

      <SectionLabel>Header Alignment</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {(["left", "center", "right"] as const).map((a) => (
          <VisualOption key={a} label={a.charAt(0).toUpperCase() + a.slice(1)} selected={layout.headerAlignment === a} onClick={() => updateLayout({ headerAlignment: a })}>
            <div className="w-full space-y-1">
              {a === "left" && <>
                <div className="h-1.5 rounded-full bg-current w-3/4 opacity-70" />
                <div className="h-1 rounded-full bg-current w-1/2 opacity-40" />
                <div className="h-1 rounded-full bg-current w-2/3 opacity-40" />
              </>}
              {a === "center" && <>
                <div className="h-1.5 rounded-full bg-current w-3/4 opacity-70 mx-auto" />
                <div className="h-1 rounded-full bg-current w-1/2 opacity-40 mx-auto" />
                <div className="h-1 rounded-full bg-current w-2/3 opacity-40 mx-auto" />
              </>}
              {a === "right" && <>
                <div className="h-1.5 rounded-full bg-current w-3/4 opacity-70 ml-auto" />
                <div className="h-1 rounded-full bg-current w-1/2 opacity-40 ml-auto" />
                <div className="h-1 rounded-full bg-current w-2/3 opacity-40 ml-auto" />
              </>}
            </div>
          </VisualOption>
        ))}
      </div>

      <SectionLabel>Skills Layout</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <VisualOption label="Inline" selected={layout.skillsLayout === "inline"} onClick={() => updateLayout({ skillsLayout: "inline" })}>
          <div className="flex flex-wrap gap-1 justify-center">
            {["React", "Node", "TS", "AWS"].map((s) => (
              <span key={s} className="text-[7px] border rounded px-1 py-0.5 opacity-60">{s}</span>
            ))}
          </div>
        </VisualOption>
        <VisualOption label="Columns" selected={layout.skillsLayout === "columns"} onClick={() => updateLayout({ skillsLayout: "columns" })}>
          <div className="grid grid-cols-2 gap-1 w-full px-2">
            {["• React", "• Node", "• TypeScript", "• AWS"].map((s) => (
              <span key={s} className="text-[7px] opacity-60">{s}</span>
            ))}
          </div>
        </VisualOption>
      </div>

      {layout.skillsLayout === "columns" && (
        <div className="flex items-center justify-between mt-2 border rounded-lg px-3 py-2">
          <span className="text-xs text-gray-600">Columns</span>
          <div className="flex items-center gap-3">
            <button onClick={() => updateLayout({ skillsColumns: Math.max(2, layout.skillsColumns - 1) })} className="w-6 h-6 rounded border flex items-center justify-center text-gray-500 hover:bg-gray-100">−</button>
            <span className="text-sm font-medium w-4 text-center">{layout.skillsColumns}</span>
            <button onClick={() => updateLayout({ skillsColumns: Math.min(6, layout.skillsColumns + 1) })} className="w-6 h-6 rounded border flex items-center justify-center text-gray-500 hover:bg-gray-100">+</button>
          </div>
        </div>
      )}

      <SectionLabel>Education Layout</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <VisualOption label="Stacked" selected={layout.educationLayout === "stacked"} onClick={() => updateLayout({ educationLayout: "stacked" })}>
          <div className="w-full space-y-1 px-1">
            <div className="h-1.5 w-3/4 rounded bg-current opacity-50" />
            <div className="h-1 w-1/2 rounded bg-current opacity-30" />
            <div className="h-1 w-1/3 rounded bg-current opacity-25" />
          </div>
        </VisualOption>
        <VisualOption label="Inline" selected={layout.educationLayout === "inline"} onClick={() => updateLayout({ educationLayout: "inline" })}>
          <div className="w-full space-y-1 px-1">
            <div className="flex justify-between items-center">
              <div className="h-1.5 w-1/2 rounded bg-current opacity-50" />
              <div className="h-1 w-1/4 rounded bg-current opacity-30" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-1 w-2/5 rounded bg-current opacity-30" />
              <div className="h-1 w-1/4 rounded bg-current opacity-25" />
            </div>
          </div>
        </VisualOption>
      </div>

      <div className="pt-4 pb-2">
        <button
          onClick={resetLayout}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
