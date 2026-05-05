"use client";

import { cn } from "@/lib/utils/cn";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  decimals?: number;
  className?: string;
}

export function Slider({ min, max, step = 1, value, onChange, label, unit = "", decimals = 0, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full min-w-[48px] text-center">
          {display}{unit}
        </span>
      </div>
      <div className="relative flex items-center h-5">
        {/* Track */}
        <div className="absolute w-full h-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-500
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:cursor-grab
          "
        />
      </div>
    </div>
  );
}
