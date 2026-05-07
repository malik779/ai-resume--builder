"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useResumeStore } from "@/stores/resume.store";
import { useCustomizeStore } from "@/stores/customize.store";
import { TemplateTab } from "./TemplateTab";
import { TextTab } from "./TextTab";
import { LayoutTab } from "./LayoutTab";

type Tab = "template" | "text" | "layout";

const TABS: { id: Tab; label: string }[] = [
  { id: "template", label: "Template & Colors" },
  { id: "text",     label: "Text" },
  { id: "layout",   label: "Layout" },
];

export function CustomizePanel() {
  const [activeTab, setActiveTab] = useState<Tab>("template");

  const resumeId = useResumeStore((s) => s.resume?.id);
  const mainColor = useCustomizeStore((s) => s.mainColor);
  const text = useCustomizeStore((s) => s.text);
  const layout = useCustomizeStore((s) => s.layout);

  // Debounced persistence of theme via the resume.theme.apply action.
  // Skips the first render so we don't overwrite the DB with localStorage on mount.
  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!resumeId) return;
    const handle = setTimeout(() => {
      fetch(`/api/resume/${resumeId}/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainColor, text, layout }),
      }).catch(() => {
        // non-fatal; localStorage retains the runtime state
      });
    }, 800);
    return () => clearTimeout(handle);
  }, [resumeId, mainColor, text, layout]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "template" && <TemplateTab />}
        {activeTab === "text"     && <TextTab />}
        {activeTab === "layout"   && <LayoutTab />}
      </div>
    </div>
  );
}
