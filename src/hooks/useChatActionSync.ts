"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/stores/resume.store";
import { useCustomizeStore } from "@/stores/customize.store";
import type { ChatSessionState } from "@/hooks/useChatSession";

// Reads completed step outputs from the chat session and pushes the relevant
// resume changes into the zustand stores so the open editor reflects
// chat-driven mutations without a page reload.
//
// Phase 3 carry-over:
//   - resume.template.select  → push templateId into resume + customize stores
//   - resume.theme.apply      → push mainColor / text / layout into customize store
//
// Phase 4:
//   - resume.autoBuild.fromParse → router.replace to the new resume id

export function useChatActionSync(
  state: ChatSessionState,
  options: { onResumeBuilt?: (resumeId: string) => void } = {},
) {
  const router = useRouter();
  const setResumeStoreTemplate = useResumeStore((s) => s.setTemplate);
  const setCustomizeTemplate = useCustomizeStore((s) => s.setTemplate);
  const setMainColor = useCustomizeStore((s) => s.setMainColor);
  const updateText = useCustomizeStore((s) => s.updateText);
  const updateLayout = useCustomizeStore((s) => s.updateLayout);

  // Track which step indices we have already applied so re-renders don't
  // re-fire side effects.
  const appliedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    for (const step of state.steps) {
      if (step.status !== "completed") continue;
      if (appliedRef.current.has(step.stepIndex)) continue;

      const output = step.output as
        | undefined
        | {
            resume?: { templateId?: string };
            template?: { slug?: string };
            theme?: {
              mainColor?: string;
              text?: Record<string, unknown>;
              layout?: Record<string, unknown>;
            };
            resumeId?: string;
          };

      if (!output) {
        appliedRef.current.add(step.stepIndex);
        continue;
      }

      switch (step.actionId) {
        case "resume.template.select": {
          const templateId =
            output.template?.slug ?? output.resume?.templateId;
          if (typeof templateId === "string") {
            setResumeStoreTemplate(templateId);
            setCustomizeTemplate(
              templateId as Parameters<typeof setCustomizeTemplate>[0],
            );
          }
          break;
        }

        case "resume.theme.apply": {
          const theme = output.theme;
          if (!theme) break;
          if (typeof theme.mainColor === "string") setMainColor(theme.mainColor);
          if (theme.text && Object.keys(theme.text).length > 0) {
            updateText(theme.text as Parameters<typeof updateText>[0]);
          }
          if (theme.layout && Object.keys(theme.layout).length > 0) {
            updateLayout(theme.layout as Parameters<typeof updateLayout>[0]);
          }
          break;
        }

        case "resume.autoBuild.fromParse": {
          const newResumeId = output.resumeId;
          if (typeof newResumeId === "string") {
            options.onResumeBuilt?.(newResumeId);
            router.replace(`/resume/${newResumeId}`);
          }
          break;
        }

        default:
          break;
      }

      appliedRef.current.add(step.stepIndex);
    }
  }, [
    state.steps,
    router,
    setResumeStoreTemplate,
    setCustomizeTemplate,
    setMainColor,
    updateText,
    updateLayout,
    options,
  ]);
}
