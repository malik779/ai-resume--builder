"use client";

import { useState } from "react";
import { Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ConfigItem {
  key: string;
  group: string;
  label: string;
  description?: string;
  sensitive?: boolean;
  valueType: "string" | "number" | "boolean";
  currentValue: string | null;
  hasDbValue: boolean;
}

interface GroupData {
  group: string;
  items: ConfigItem[];
}

const GROUP_LABELS: Record<string, string> = {
  ai: "AI Providers",
  stripe: "Stripe",
  tiers: "Tier Limits",
  features: "Feature Flags",
  app: "App Settings",
};

export function ConfigEditor({ groups }: { groups: GroupData[] }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.group ?? "ai");
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(groups.flatMap((g) => g.items.map((i) => [i.key, i.currentValue ?? ""])))
  );
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const current = groups.find((g) => g.group === activeGroup);

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    setError("");

    const updates = current.items
      .filter((item) => values[item.key] !== "" && values[item.key] !== null)
      .map((item) => ({ key: item.key, value: values[item.key] }));

    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Save failed");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleClear = async (key: string) => {
    await fetch("/api/admin/config", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setValues((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="flex gap-6">
      {/* Group tabs */}
      <div className="w-44 shrink-0 space-y-0.5">
        {groups.map(({ group }) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeGroup === group
                ? "bg-violet-600/20 text-violet-300"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            )}
          >
            {GROUP_LABELS[group] ?? group}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white">{GROUP_LABELS[activeGroup] ?? activeGroup}</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
              saved ? "bg-emerald-700 text-white" : "bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
            )}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved!" : saving ? "Saving…" : "Save group"}
          </button>
        </div>

        <div className="space-y-5">
          {current?.items.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">{item.label}</label>
                {item.hasDbValue && (
                  <button
                    type="button"
                    onClick={() => handleClear(item.key)}
                    className="text-[10px] text-gray-600 hover:text-red-400 flex items-center gap-0.5 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> reset to env
                  </button>
                )}
              </div>
              {item.description && <p className="text-[11px] text-gray-500 mb-1.5">{item.description}</p>}

              {item.valueType === "boolean" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setValues((p) => ({ ...p, [item.key]: p[item.key] === "true" ? "false" : "true" }))}
                    className={cn(
                      "relative w-9 h-5 rounded-full transition-colors cursor-pointer",
                      values[item.key] === "true" ? "bg-violet-600" : "bg-gray-700"
                    )}
                  >
                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", values[item.key] === "true" ? "left-4" : "left-0.5")} />
                  </div>
                  <span className="text-xs text-gray-400">{values[item.key] === "true" ? "Enabled" : "Disabled"}</span>
                </label>
              ) : (
                <div className="relative">
                  <input
                    type={item.sensitive && !revealed.has(item.key) ? "password" : "text"}
                    value={values[item.key] ?? ""}
                    onChange={(e) => setValues((p) => ({ ...p, [item.key]: e.target.value }))}
                    placeholder={item.hasDbValue ? "••••••••" : `env var fallback`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 pr-8"
                  />
                  {item.sensitive && (
                    <button
                      type="button"
                      onClick={() => setRevealed((s) => { const n = new Set(s); n.has(item.key) ? n.delete(item.key) : n.add(item.key); return n; })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {revealed.has(item.key) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs mt-4">{error}</p>}
      </div>
    </div>
  );
}
