import { actionId, workflowId } from "@/ai-core";

export const ACTION_IDS = {
  CREATE_RESUME: actionId("resume.create"),
  UPDATE_SECTION: actionId("resume.section.update"),
  SELECT_TEMPLATE: actionId("resume.template.select"),
  APPLY_THEME: actionId("resume.theme.apply"),
  GENERATE_SUMMARY: actionId("resume.summary.generate"),
  PARSE_UPLOAD: actionId("resume.parseUpload"),
  AUTO_BUILD_FROM_PARSE: actionId("resume.autoBuild.fromParse"),
  // Phase 6 — admin template ingestion from screenshot
  INGEST_TEMPLATE_SCREENSHOT: actionId("resume.template.ingestScreenshot"),
} as const;

export const WORKFLOW_IDS = {
  REGENERATE_SUMMARY: workflowId("resume.summary.regenerate"),
  PARSE_AND_BUILD: workflowId("resume.parse.build"),
} as const;
