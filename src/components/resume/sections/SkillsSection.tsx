"use client";

import { useState } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { EnhancePanel } from "@/components/ai/EnhancePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Sparkles } from "lucide-react";
import type { Skill } from "@/types/resume";

interface SkillsSectionProps { resumeId: string; }

export function SkillsSection({ resumeId }: SkillsSectionProps) {
  const { resume, setSkills } = useResumeStore();
  const [input, setInput] = useState("");
  const [showAI, setShowAI] = useState(false);

  const skills = resume?.skills ?? [];

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills([...skills, { name: trimmed }]);
  };

  const removeSkill = (name: string) => setSkills(skills.filter((s) => s.name !== name));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
      setInput("");
    }
  };

  const handleAIAccept = (enhanced: string) => {
    // AI returns a comma- or newline-separated list of skills
    const parsed = enhanced
      .split(/[,\n]/)
      .map((s) => s.replace(/^[•\-*]\s*/, "").trim())
      .filter(Boolean);
    setSkills(parsed.map((name) => ({ name })));
    setShowAI(false);
  };

  const SUGGESTED = ["TypeScript", "React", "Node.js", "Python", "AWS", "SQL", "Docker", "GraphQL"];
  const filteredSuggested = SUGGESTED.filter((s) => !skills.some((sk) => sk.name === s));

  return (
    <div className="space-y-3">
      {/* Skill pills */}
      <div className="min-h-[60px] rounded-xl border border-gray-200 bg-gray-50 p-3 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill.name}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700"
          >
            {skill.name}
            <button onClick={() => removeSkill(skill.name)} className="hover:text-red-500 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-xs text-gray-300">Add skills below or press Enter after typing</span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a skill and press Enter (e.g. TypeScript)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => { addSkill(input); setInput(""); }}
          disabled={!input.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick suggestions */}
      {filteredSuggested.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {filteredSuggested.map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAI(!showAI)}
        className="flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {showAI ? "Hide AI" : "Generate skills with AI"}
      </button>

      {showAI && (
        <EnhancePanel
          resumeId={resumeId}
          sectionType="skills"
          currentContent={skills.map((s) => s.name).join(", ")}
          onAccept={handleAIAccept}
        />
      )}
    </div>
  );
}
