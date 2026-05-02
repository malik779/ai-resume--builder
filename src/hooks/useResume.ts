"use client";

import { useCallback, useEffect, useRef } from "react";
import { useResumeStore } from "@/stores/resume.store";
import { toast } from "@/components/ui/toaster";
import type { Resume } from "@/types/resume";

const AUTOSAVE_DEBOUNCE_MS = 1500;

// Auto-saves the resume whenever isDirty flips true.
// Returns a manual save trigger for the Save button.
export function useAutoSave(resumeId: string) {
  const { isDirty, isSaving, resume, setSaving, markClean } = useResumeStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (!resume || isSaving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/resume/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resume.title,
          templateId: resume.templateId,
          summary: resume.summary,
          personalInfo: resume.personalInfo,
          skills: resume.skills,
          certifications: resume.certifications,
          languages: resume.languages,
          awards: resume.awards,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      markClean();
    } catch {
      toast({ title: "Auto-save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [resume, isSaving, resumeId, setSaving, markClean]);

  // Debounced auto-save on every dirty change
  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isDirty, save]);

  return { save, isSaving };
}

// Saves a relational section item (experience, education, project)
export function useSectionMutation(resumeId: string) {
  const mutate = useCallback(async (
    type: "experience" | "education" | "project",
    action: "create" | "update" | "delete" | "reorder",
    payload: { id?: string; data?: Record<string, unknown>; ids?: string[] }
  ) => {
    const res = await fetch(`/api/resume/${resumeId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, action, ...payload }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? "Section update failed");
    }
    return res.json();
  }, [resumeId]);

  return { mutate };
}
