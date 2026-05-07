import { z } from "zod";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { ActionDefinition } from "@/ai-core";
import type { ResumeRepository } from "@/lib/db/repositories/resume.repository";
import { ACTION_IDS } from "../action-ids";
import { ParsedResumeSchema, type ParsedResume } from "./parse-upload";

const AutoBuildInputSchema = z.object({
  userId: z.string().min(1),
  parsed: ParsedResumeSchema,
  templateId: z.string().min(1).default("classic"),
  title: z.string().min(1).max(120).optional(),
});
export type AutoBuildInput = z.infer<typeof AutoBuildInputSchema>;

export interface AutoBuildOutput {
  resumeId: string;
  sectionsBuilt: string[];
  experienceCount: number;
  educationCount: number;
  certificationsCount: number;
  languagesCount: number;
}

export interface AutoBuildDeps {
  resumes: Pick<ResumeRepository, "create">;
  db: PrismaClient;
}

const MAX_EXPERIENCES = 20;
const MAX_EDUCATIONS = 10;

function deriveTitle(parsed: ParsedResume): string {
  const fullName = [parsed.personalInfo.firstName, parsed.personalInfo.lastName]
    .filter((s) => s && s.trim().length > 0)
    .join(" ");
  const headline = parsed.personalInfo.headline?.trim();
  if (fullName && headline) return `${fullName} — ${headline}`;
  if (fullName) return `${fullName} Resume`;
  if (headline) return headline;
  return "Imported Resume";
}

export function createAutoBuildFromParseAction(
  deps: AutoBuildDeps,
): ActionDefinition<AutoBuildInput, AutoBuildOutput> {
  return {
    id: ACTION_IDS.AUTO_BUILD_FROM_PARSE,
    description:
      "Materialize a parsed resume into Resume + WorkExperience + Education rows.",
    inputSchema: AutoBuildInputSchema,
    async execute(input, ctx) {
      const sectionsBuilt: string[] = [];
      const title = input.title ?? deriveTitle(input.parsed);

      ctx.emit?.("resume.autoBuild.started", {
        userId: input.userId,
        templateId: input.templateId,
      });

      const resume = await deps.resumes.create({
        user: { connect: { id: input.userId } },
        title,
        templateId: input.templateId,
        personalInfo: input.parsed.personalInfo as unknown as Prisma.InputJsonValue,
        summary: input.parsed.summary ?? "",
        skills: input.parsed.skills as unknown as Prisma.InputJsonValue,
        certifications: input.parsed.certifications as unknown as Prisma.InputJsonValue,
        languages: input.parsed.languages as unknown as Prisma.InputJsonValue,
      });
      sectionsBuilt.push("personalInfo");
      if (input.parsed.summary && input.parsed.summary.length > 0) sectionsBuilt.push("summary");
      if (input.parsed.skills.length > 0) sectionsBuilt.push("skills");
      if (input.parsed.certifications.length > 0) sectionsBuilt.push("certifications");
      if (input.parsed.languages.length > 0) sectionsBuilt.push("languages");

      const experiencesToWrite = input.parsed.experiences.slice(0, MAX_EXPERIENCES);
      const educationsToWrite = input.parsed.educations.slice(0, MAX_EDUCATIONS);

      if (experiencesToWrite.length > 0) {
        await Promise.all(
          experiencesToWrite.map((exp, i) =>
            deps.db.workExperience.create({
              data: {
                resumeId: resume.id,
                company: exp.company,
                title: exp.title,
                location: exp.location ?? null,
                startDate: exp.startDate,
                endDate: exp.endDate ?? null,
                current: exp.current,
                bullets: exp.bullets as unknown as Prisma.InputJsonValue,
                order: i,
              },
            }).catch(() => null),
          ),
        );
        sectionsBuilt.push("experiences");
      }

      if (educationsToWrite.length > 0) {
        await Promise.all(
          educationsToWrite.map((edu, i) =>
            deps.db.education.create({
              data: {
                resumeId: resume.id,
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field ?? null,
                startDate: edu.startDate,
                endDate: edu.endDate ?? null,
                current: edu.current,
                gpa: edu.gpa ?? null,
                honors: edu.honors ?? null,
                order: i,
              },
            }).catch(() => null),
          ),
        );
        sectionsBuilt.push("educations");
      }

      const result: AutoBuildOutput = {
        resumeId: resume.id,
        sectionsBuilt,
        experienceCount: experiencesToWrite.length,
        educationCount: educationsToWrite.length,
        certificationsCount: input.parsed.certifications.length,
        languagesCount: input.parsed.languages.length,
      };

      ctx.emit?.("resume.autoBuild.completed", result);

      return result;
    },
  };
}
