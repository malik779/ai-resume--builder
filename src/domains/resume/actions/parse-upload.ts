import { z } from "zod";
import type { ActionDefinition } from "@/ai-core";
import { ACTION_IDS } from "../action-ids";
import { getTier } from "../services/context";
import type { ResumeProviderRouter } from "../services/ai-provider";
import type { AiUsageRecorder } from "../server/telemetry";

const PersonalInfoSchema = z.object({
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  headline: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
});

const ExperienceSchema = z.object({
  company: z.string().default(""),
  title: z.string().default(""),
  location: z.string().optional(),
  startDate: z.string().default(""),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

const EducationSchema = z.object({
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().optional(),
  startDate: z.string().default(""),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  gpa: z.string().optional(),
  honors: z.string().optional(),
});

const SkillSchema = z.object({ name: z.string() });

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
});

const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z.string().default("professional"),
});

export const ParsedResumeSchema = z.object({
  personalInfo: PersonalInfoSchema.default({ firstName: "", lastName: "" }),
  summary: z.string().optional(),
  experiences: z.array(ExperienceSchema).default([]),
  educations: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
});
export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

const ParseUploadInputSchema = z.object({
  rawText: z.string().min(50).max(60000),
  hint: z.string().max(200).optional(),
});
export type ParseUploadInput = z.infer<typeof ParseUploadInputSchema>;

export interface ParseUploadOutput {
  parsed: ParsedResume;
  fieldsExtracted: number;
  confidence: number;
  modelId: string;
  costUsd: number;
}

export interface ParseUploadDeps {
  router: ResumeProviderRouter;
  aiUsage?: AiUsageRecorder;
}

const PARSE_SYSTEM = `You are an expert resume parser. Extract ALL resume data into the exact JSON schema provided.

Rules:
- Extract every piece of data, no matter how small
- Preserve exact dates, company names, and job titles as written
- Each achievement bullet = one array item
- If a field is genuinely missing, use null or an empty string — never fabricate
- Detect "Present" / "current" end dates → set current: true and endDate: ""
- Output ONLY valid JSON. No markdown fences. No commentary.`;

const SCHEMA_HINT = JSON.stringify(
  {
    personalInfo: {
      firstName: "",
      lastName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
    },
    summary: "",
    experiences: [
      {
        company: "",
        title: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [],
      },
    ],
    educations: [
      {
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        current: false,
        gpa: "",
        honors: "",
      },
    ],
    skills: [{ name: "" }],
    certifications: [{ name: "", issuer: "", date: "" }],
    languages: [{ name: "", proficiency: "professional" }],
  },
  null,
  2,
);

function countFields(p: ParsedResume): number {
  let n = 0;
  n += Object.values(p.personalInfo).filter((v) => typeof v === "string" && v.trim().length > 0).length;
  if (p.summary && p.summary.length > 10) n++;
  n += p.experiences.length * 3;
  n += p.educations.length * 2;
  n += p.skills.length;
  n += p.certifications.length;
  n += p.languages.length;
  return n;
}

// Confidence: a 0..1 estimate of how complete and well-formed the parsed
// resume is. Phase 5 uses this to decide whether the parse is good enough or
// the workflow should escalate to a stronger model.
//
// Required checks always count. Conditional checks (e.g. "experiences are
// well-formed") only count when the prerequisite section exists, otherwise
// vacuous-truth on empty arrays would inflate the score on sparse parses.
function computeConfidence(p: ParsedResume): number {
  const checks: boolean[] = [];

  // Always-counted signals
  checks.push(p.personalInfo.firstName.trim().length > 0);
  checks.push(p.personalInfo.lastName.trim().length > 0);
  checks.push(!!p.personalInfo.email && p.personalInfo.email.includes("@"));
  checks.push((p.summary?.trim().length ?? 0) > 20);
  checks.push(p.experiences.length > 0);
  checks.push(p.educations.length > 0);
  checks.push(p.skills.length > 0);

  // Conditional quality signals
  if (p.experiences.length > 0) {
    checks.push(
      p.experiences.every(
        (e) => e.company.trim().length > 0 && e.title.trim().length > 0,
      ),
    );
    checks.push(
      p.experiences.every((e) => e.startDate.trim().length >= 4),
    );
    checks.push(p.experiences.some((e) => e.bullets.length > 0));
  }
  if (p.educations.length > 0) {
    checks.push(
      p.educations.every((e) => e.institution.trim().length > 0),
    );
  }

  const passing = checks.filter(Boolean).length;
  return Number((passing / checks.length).toFixed(2));
}

export function createParseUploadAction(
  deps: ParseUploadDeps,
): ActionDefinition<ParseUploadInput, ParseUploadOutput> {
  return {
    id: ACTION_IDS.PARSE_UPLOAD,
    description:
      "Take pre-extracted resume text and produce a validated structured ParsedResume.",
    inputSchema: ParseUploadInputSchema,
    async execute(input, ctx) {
      const tier = getTier(ctx);
      const provider = deps.router.forTier(tier);

      const userPrompt = `Parse this resume into JSON.

${input.hint ? `Hint: ${input.hint}\n\n` : ""}RAW TEXT:
${input.rawText}

Schema:
${SCHEMA_HINT}`;

      ctx.emit?.("resume.parseUpload.started", {
        modelId: provider.modelId,
        rawTextLength: input.rawText.length,
      });

      const { output, meta } = await provider.completeJSON<unknown>(userPrompt, {
        system: PARSE_SYSTEM,
        signal: ctx.signal,
      });

      const parsed = ParsedResumeSchema.parse(output);
      const fieldsExtracted = countFields(parsed);
      const confidence = computeConfidence(parsed);

      if (deps.aiUsage && ctx.userId) {
        void deps.aiUsage.record({
          userId: ctx.userId,
          actionId: "resume.parseUpload",
          operation: "ENHANCE",
          model: meta.modelId,
          promptTokens: meta.promptTokens,
          outputTokens: meta.outputTokens,
          costUsd: meta.costUsd,
          durationMs: meta.durationMs,
          success: true,
          tier,
          sessionId: ctx.sessionId,
        });
      }

      ctx.emit?.("resume.parseUpload.completed", {
        modelId: meta.modelId,
        costUsd: meta.costUsd,
        fieldsExtracted,
        confidence,
        experienceCount: parsed.experiences.length,
        educationCount: parsed.educations.length,
      });

      return {
        parsed,
        fieldsExtracted,
        confidence,
        modelId: meta.modelId,
        costUsd: meta.costUsd,
      };
    },
  };
}
