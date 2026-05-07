import type { PrismaClient } from "@prisma/client";
import type { ActionRegistry, IOrchestrator } from "@/ai-core";
import type { ResumeRepository } from "@/lib/db/repositories/resume.repository";
import type { TemplateMeta } from "@/lib/template-service";
import type { AiUsageRecorder } from "./server/telemetry";
import {
  createCreateResumeAction,
  createUpdateSectionAction,
  createSelectTemplateAction,
  createApplyThemeAction,
  createGenerateSummaryAction,
  createParseUploadAction,
  createAutoBuildFromParseAction,
} from "./actions";
import { regenerateSummaryWorkflow, parseAndBuildWorkflow } from "./workflows";
import type { ResumeProviderRouter } from "./services/ai-provider";

export interface ResumeDomainDeps {
  resumes: ResumeRepository;
  db: PrismaClient;
  listActiveTemplates: () => Promise<TemplateMeta[]>;
  router: ResumeProviderRouter;
  // Phase 5: optional AI usage telemetry. Falsy = no telemetry (tests, dev).
  aiUsage?: AiUsageRecorder;
}

export function registerResumeActions(
  registry: ActionRegistry,
  deps: ResumeDomainDeps,
): void {
  registry.register(createCreateResumeAction({ resumes: deps.resumes }));
  registry.register(createUpdateSectionAction({ resumes: deps.resumes }));
  registry.register(
    createSelectTemplateAction({
      resumes: deps.resumes,
      listActiveTemplates: deps.listActiveTemplates,
    }),
  );
  registry.register(createApplyThemeAction({ resumes: deps.resumes }));
  registry.register(
    createGenerateSummaryAction({ router: deps.router, aiUsage: deps.aiUsage }),
  );
  registry.register(
    createParseUploadAction({ router: deps.router, aiUsage: deps.aiUsage }),
  );
  registry.register(
    createAutoBuildFromParseAction({ resumes: deps.resumes, db: deps.db }),
  );
}

export function registerResumeWorkflows(orchestrator: IOrchestrator): void {
  orchestrator.registerWorkflow(regenerateSummaryWorkflow);
  orchestrator.registerWorkflow(parseAndBuildWorkflow);
}
