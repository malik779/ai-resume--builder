"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import type { WorkflowStepState } from "@/hooks/useChatSession";

const ACTION_LABELS: Record<string, string> = {
  "resume.create": "Creating resume",
  "resume.section.update": "Updating section",
  "resume.template.select": "Selecting template",
  "resume.theme.apply": "Applying theme",
  "resume.summary.generate": "Generating summary",
  "resume.parseUpload": "Reading your resume",
  "resume.autoBuild.fromParse": "Building your profile",
};

function labelFor(actionId: string): string {
  return ACTION_LABELS[actionId] ?? actionId;
}

interface Props {
  status: "idle" | "planning" | "executing" | "done" | "error";
  steps: WorkflowStepState[];
  errorMessage?: string | null;
}

export function WorkflowProgress({ status, steps, errorMessage }: Props) {
  const showCard =
    status === "planning" ||
    status === "executing" ||
    status === "done" ||
    status === "error" ||
    steps.length > 0;
  if (!showCard) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-xl border border-blue-100 bg-blue-50/60 backdrop-blur-sm p-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
          {status === "planning"
            ? "Planning your request"
            : status === "executing"
            ? "Executing"
            : status === "done"
            ? "Done"
            : status === "error"
            ? "Halted"
            : "Workflow"}
        </span>
        {status === "planning" && (
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        )}
      </div>

      {steps.length === 0 && status === "planning" && (
        <div className="text-xs text-blue-800/70 italic">
          Working out which actions to run…
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {steps.map((step) => (
            <motion.li
              key={step.stepIndex}
              layout
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                {step.status === "running" && (
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                )}
                {step.status === "completed" && (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </span>
                )}
                {step.status === "failed" && (
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </span>
                )}
                {step.status === "pending" && (
                  <span className="w-2 h-2 rounded-full border border-blue-400" />
                )}
              </span>
              <span
                className={
                  step.status === "completed"
                    ? "text-blue-900/70"
                    : step.status === "failed"
                    ? "text-red-700"
                    : "text-blue-900"
                }
              >
                {labelFor(step.actionId)}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {status === "error" && errorMessage && (
        <div className="text-[11px] text-red-700 bg-red-50 rounded-md px-2 py-1 border border-red-200 mt-1">
          {errorMessage}
        </div>
      )}
    </motion.div>
  );
}
