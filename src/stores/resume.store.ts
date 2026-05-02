import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Resume, WorkExperience, Education, Project, Skill } from "@/types/resume";

// ─────────────────────────────────────────────────────────────────────────────
// Resume editor store — owns all mutable resume state during an edit session.
// Persists changes via auto-save (debounced API calls in the useResume hook).
// ─────────────────────────────────────────────────────────────────────────────

interface ResumeState {
  resume: Resume | null;
  isDirty: boolean;
  isSaving: boolean;
  activeSection: string | null;

  // Actions
  setResume: (resume: Resume) => void;
  updatePersonalInfo: (data: Partial<Resume["personalInfo"]>) => void;
  updateSummary: (summary: string) => void;
  addExperience: (exp: WorkExperience) => void;
  updateExperience: (id: string, data: Partial<WorkExperience>) => void;
  removeExperience: (id: string) => void;
  reorderExperiences: (ids: string[]) => void;
  addEducation: (edu: Education) => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addProject: (proj: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setSkills: (skills: Skill[]) => void;
  setTemplate: (templateId: string) => void;
  setActiveSection: (section: string | null) => void;
  setSaving: (saving: boolean) => void;
  markClean: () => void;
}

export const useResumeStore = create<ResumeState>()(
  devtools(
    (set) => ({
      resume: null,
      isDirty: false,
      isSaving: false,
      activeSection: null,

      setResume: (resume) => set({ resume, isDirty: false }),

      updatePersonalInfo: (data) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, personalInfo: { ...s.resume.personalInfo, ...data } } : null,
          isDirty: true,
        })),

      updateSummary: (summary) =>
        set((s) => ({ resume: s.resume ? { ...s.resume, summary } : null, isDirty: true })),

      addExperience: (exp) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, experiences: [...s.resume.experiences, exp] } : null,
          isDirty: true,
        })),

      updateExperience: (id, data) =>
        set((s) => ({
          resume: s.resume
            ? { ...s.resume, experiences: s.resume.experiences.map((e) => (e.id === id ? { ...e, ...data } : e)) }
            : null,
          isDirty: true,
        })),

      removeExperience: (id) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, experiences: s.resume.experiences.filter((e) => e.id !== id) } : null,
          isDirty: true,
        })),

      reorderExperiences: (ids) =>
        set((s) => {
          if (!s.resume) return {};
          const map = Object.fromEntries(s.resume.experiences.map((e) => [e.id, e]));
          return { resume: { ...s.resume, experiences: ids.map((id, i) => ({ ...map[id], order: i })) }, isDirty: true };
        }),

      addEducation: (edu) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, educations: [...s.resume.educations, edu] } : null,
          isDirty: true,
        })),

      updateEducation: (id, data) =>
        set((s) => ({
          resume: s.resume
            ? { ...s.resume, educations: s.resume.educations.map((e) => (e.id === id ? { ...e, ...data } : e)) }
            : null,
          isDirty: true,
        })),

      removeEducation: (id) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, educations: s.resume.educations.filter((e) => e.id !== id) } : null,
          isDirty: true,
        })),

      addProject: (proj) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, projects: [...s.resume.projects, proj] } : null,
          isDirty: true,
        })),

      updateProject: (id, data) =>
        set((s) => ({
          resume: s.resume
            ? { ...s.resume, projects: s.resume.projects.map((p) => (p.id === id ? { ...p, ...data } : p)) }
            : null,
          isDirty: true,
        })),

      removeProject: (id) =>
        set((s) => ({
          resume: s.resume ? { ...s.resume, projects: s.resume.projects.filter((p) => p.id !== id) } : null,
          isDirty: true,
        })),

      setSkills: (skills) =>
        set((s) => ({ resume: s.resume ? { ...s.resume, skills } : null, isDirty: true })),

      setTemplate: (templateId) =>
        set((s) => ({ resume: s.resume ? { ...s.resume, templateId } : null, isDirty: true })),

      setActiveSection: (section) => set({ activeSection: section }),
      setSaving: (isSaving) => set({ isSaving }),
      markClean: () => set({ isDirty: false }),
    }),
    { name: "resume-store" }
  )
);
