"use client";

import { useCustomizeStore, AVAILABLE_FONTS, type FontWeight } from "@/stores/customize.store";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";

const FONT_WEIGHTS: FontWeight[] = ["Thin", "Light", "Regular", "Medium", "SemiBold", "Bold", "ExtraBold"];

function Select({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 border border-gray-200 rounded-md text-xs px-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-5 mb-2">{children}</p>
  );
}

export function TextTab() {
  const { text, updateText, resetText } = useCustomizeStore();

  return (
    <div className="flex flex-col h-full overflow-auto px-4 py-4 space-y-1">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Primary Font" value={text.primaryFont} onChange={(v) => updateText({ primaryFont: v })} options={AVAILABLE_FONTS} />
        <Select label="Secondary Font" value={text.secondaryFont} onChange={(v) => updateText({ secondaryFont: v })} options={AVAILABLE_FONTS} />
      </div>

      <div className="pt-1">
        <Slider label="Line Height" min={80} max={150} step={5} value={text.lineHeight} onChange={(v) => updateText({ lineHeight: v })} unit="%" />
      </div>

      <SectionLabel>Font Size</SectionLabel>
      <Slider label="Primary Heading" min={16} max={36} value={text.primaryHeadingSize} onChange={(v) => updateText({ primaryHeadingSize: v })} unit=" pt" />
      <Slider label="Secondary Heading" min={12} max={24} value={text.secondaryHeadingSize} onChange={(v) => updateText({ secondaryHeadingSize: v })} unit=" pt" />
      <Slider label="Body" min={8} max={14} step={0.5} value={text.bodySize} onChange={(v) => updateText({ bodySize: v })} unit=" pt" decimals={1} />
      <Slider label="Section Titles" min={10} max={18} value={text.sectionTitleSize} onChange={(v) => updateText({ sectionTitleSize: v })} unit=" pt" />

      <SectionLabel>Font Weight</SectionLabel>
      <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-2.5 text-[10px] text-blue-700">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>DOCX simplifies to Bold and Normal. PDF preserves all weight styles.</span>
      </div>
      <Select label="Primary Heading" value={text.primaryHeadingWeight} onChange={(v) => updateText({ primaryHeadingWeight: v as FontWeight })} options={FONT_WEIGHTS} />
      <Select label="Secondary Heading" value={text.secondaryHeadingWeight} onChange={(v) => updateText({ secondaryHeadingWeight: v as FontWeight })} options={FONT_WEIGHTS} />
      <Select label="Body" value={text.bodyWeight} onChange={(v) => updateText({ bodyWeight: v as FontWeight })} options={FONT_WEIGHTS} />

      <div className="pt-4 pb-2">
        <button
          onClick={resetText}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
