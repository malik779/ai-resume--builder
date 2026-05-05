"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
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

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
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

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "template" && <TemplateTab />}
        {activeTab === "text"     && <TextTab />}
        {activeTab === "layout"   && <LayoutTab />}
      </div>
    </div>
  );
}
