"use client";

import { motion } from "framer-motion";

// Stylized resume preview with a scanning-line pass while AI is working.
// Intentionally not the real ResumeCanvas — at thumbnail size the engine
// renderers are visually noisy and slow to mount. This shape is enough to
// communicate "AI is processing your resume" without misrepresenting state.

const SECTION_BARS: { width: string; weight: "light" | "bold" }[] = [
  { width: "60%", weight: "bold" },
  { width: "40%", weight: "light" },
  { width: "95%", weight: "light" },
  { width: "30%", weight: "bold" },
  { width: "85%", weight: "light" },
  { width: "70%", weight: "light" },
  { width: "30%", weight: "bold" },
  { width: "92%", weight: "light" },
  { width: "78%", weight: "light" },
  { width: "65%", weight: "light" },
];

interface Props {
  active: boolean;
  accent?: string;
}

export function AnimatedResumeThumbnail({ active, accent = "#4A6CF7" }: Props) {
  return (
    <div
      className="relative mx-auto rounded-md bg-white shadow-lg overflow-hidden"
      style={{
        width: 200,
        height: 282,
        border: "1px solid #e5e7eb",
      }}
      aria-label="AI is working on your resume"
    >
      {/* Header band */}
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "#f1f5f9" }}>
        <div
          className="h-2.5 rounded-sm mb-1.5"
          style={{ width: "70%", background: accent }}
        />
        <div
          className="h-1.5 rounded-sm"
          style={{ width: "45%", background: "#cbd5e1" }}
        />
      </div>

      {/* Body bars */}
      <div className="px-4 py-3 flex flex-col gap-1.5">
        {SECTION_BARS.map((b, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: b.width,
              height: b.weight === "bold" ? 4 : 2.5,
              background: b.weight === "bold" ? "#475569" : "#cbd5e1",
              marginTop: b.weight === "bold" && i > 0 ? 8 : 0,
            }}
          />
        ))}
      </div>

      {/* Scanning line overlay */}
      {active && (
        <>
          <motion.div
            className="absolute inset-x-0 pointer-events-none"
            style={{
              height: 32,
              background: `linear-gradient(180deg, transparent 0%, ${accent}33 40%, ${accent}66 50%, ${accent}33 60%, transparent 100%)`,
              filter: "blur(0.4px)",
            }}
            initial={{ y: -32 }}
            animate={{ y: [-32, 282, -32] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-x-0 pointer-events-none"
            style={{ height: 1.5, background: accent, boxShadow: `0 0 8px ${accent}` }}
            initial={{ y: -2 }}
            animate={{ y: [-2, 282, -2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1.5px ${accent}55`,
              borderRadius: "inherit",
            }}
          />
        </>
      )}
    </div>
  );
}
