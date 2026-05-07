import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { ActionDefinition } from "@/ai-core";
import type { ResumeRepository } from "@/lib/db/repositories/resume.repository";
import { ACTION_IDS } from "../action-ids";

const FontWeightSchema = z.enum([
  "Thin",
  "Light",
  "Regular",
  "Medium",
  "SemiBold",
  "Bold",
  "ExtraBold",
]);

const TextSchema = z.object({
  primaryFont: z.string().min(1).optional(),
  secondaryFont: z.string().min(1).optional(),
  lineHeight: z.number().min(80).max(150).optional(),
  primaryHeadingSize: z.number().min(16).max(36).optional(),
  secondaryHeadingSize: z.number().min(12).max(24).optional(),
  bodySize: z.number().min(8).max(14).optional(),
  sectionTitleSize: z.number().min(10).max(18).optional(),
  primaryHeadingWeight: FontWeightSchema.optional(),
  secondaryHeadingWeight: FontWeightSchema.optional(),
  bodyWeight: FontWeightSchema.optional(),
});

const LayoutSchema = z.object({
  format: z.enum(["A4", "US_LETTER"]).optional(),
  headerFooter: z.number().min(0.1).max(1).optional(),
  topBottom: z.number().min(0.1).max(1.5).optional(),
  leftRight: z.number().min(0.1).max(1.5).optional(),
  betweenSections: z.number().min(4).max(32).optional(),
  betweenTitlesContent: z.number().min(2).max(16).optional(),
  betweenContentBlocks: z.number().min(2).max(16).optional(),
  insideContentBlock: z.number().min(1).max(8).optional(),
  dateFormat: z.enum(["short", "long", "numeric", "year"]).optional(),
  headerAlignment: z.enum(["left", "center", "right"]).optional(),
  skillsLayout: z.enum(["inline", "columns"]).optional(),
  skillsColumns: z.number().int().min(2).max(6).optional(),
  educationShowBy: z.enum(["institution", "degree"]).optional(),
  educationLayout: z.enum(["stacked", "inline"]).optional(),
});

const ApplyThemeInputSchema = z
  .object({
    resumeId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    mainColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Expected hex color")
      .optional(),
    text: TextSchema.optional(),
    layout: LayoutSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.resumeId && !v.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "userId is required when resumeId is provided",
      });
    }
  });

export type ApplyThemeInput = z.infer<typeof ApplyThemeInputSchema>;

export interface ResumeTheme {
  mainColor?: string;
  text: z.infer<typeof TextSchema>;
  layout: z.infer<typeof LayoutSchema>;
}

export interface ApplyThemeOutput {
  resumeId?: string;
  theme: ResumeTheme;
  persisted: boolean;
}

export interface ApplyThemeDeps {
  resumes: Pick<ResumeRepository, "findByIdAndUser" | "update">;
}

export function createApplyThemeAction(
  deps: ApplyThemeDeps,
): ActionDefinition<ApplyThemeInput, ApplyThemeOutput> {
  return {
    id: ACTION_IDS.APPLY_THEME,
    description:
      "Validate and normalize a partial resume theme. When resumeId+userId are provided, persists the merged theme to the resume row.",
    inputSchema: ApplyThemeInputSchema,
    async execute(input, ctx) {
      const incoming: ResumeTheme = {
        mainColor: input.mainColor,
        text: input.text ?? {},
        layout: input.layout ?? {},
      };

      let persisted = false;
      let theme: ResumeTheme = incoming;

      if (input.resumeId && input.userId) {
        const existing = await deps.resumes.findByIdAndUser(
          input.resumeId,
          input.userId,
        );
        if (!existing) {
          throw new Error(
            `Resume not found or not owned by user: ${input.resumeId}`,
          );
        }

        const current = (existing as unknown as { theme: ResumeTheme | null }).theme;
        const merged: ResumeTheme = {
          mainColor: incoming.mainColor ?? current?.mainColor,
          text: { ...(current?.text ?? {}), ...incoming.text },
          layout: { ...(current?.layout ?? {}), ...incoming.layout },
        };

        await deps.resumes.update(input.resumeId, {
          theme: merged as unknown as Prisma.InputJsonValue,
        });

        theme = merged;
        persisted = true;
      }

      ctx.emit?.("resume.theme.applied", {
        resumeId: input.resumeId,
        persisted,
        keys: {
          mainColor: incoming.mainColor !== undefined,
          text: Object.keys(incoming.text).length > 0,
          layout: Object.keys(incoming.layout).length > 0,
        },
      });

      return { resumeId: input.resumeId, theme, persisted };
    },
  };
}
