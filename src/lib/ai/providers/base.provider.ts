import type {
  IAIProvider,
  EnhanceInput, EnhanceOutput,
  JobAlignInput, JobAlignOutput,
  ScoreInput, ScoreOutput,
  JobEvalInput, JobEvalOutput,
  ContactInput, ContactOutput,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// BaseAIProvider — shared JSON parsing + error handling.
// Concrete providers extend this and implement callModel().
// ─────────────────────────────────────────────────────────────────────────────

export abstract class BaseAIProvider implements IAIProvider {
  abstract readonly modelId: string;

  protected abstract callModel(system: string, user: string): Promise<{ text: string; promptTokens: number; outputTokens: number }>;

  // Public access to the raw model call. Used by the ai-core generic provider
  // adapter (src/domains/resume/services/ai-provider.ts) so resume actions can
  // call .complete() / .completeJSON<T>() without going through resume-coupled
  // methods like enhance/alignJob.
  public rawComplete(system: string, user: string): Promise<{ text: string; promptTokens: number; outputTokens: number }> {
    return this.callModel(system, user);
  }

  protected async callAndParse<T>(system: string, user: string, transform: (raw: Record<string, unknown>) => T): Promise<T> {
    const { text } = await this.callModel(system, user);
    const raw = this.parseJSON(text);
    return transform(raw);
  }

  private parseJSON(text: string): Record<string, unknown> {
    // Strip potential markdown code fences
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
    }
  }

  async enhance(input: EnhanceInput): Promise<EnhanceOutput> {
    const { buildEnhancePrompt } = await import("../prompts/enhance.prompt");
    const { system, user } = buildEnhancePrompt(input);
    return this.callAndParse<EnhanceOutput>(system, user, (raw) => ({
      enhancedContent: String(raw.enhanced_content ?? ""),
      suggestedKeywords: (raw.suggested_keywords as string[]) ?? [],
      improvementsMade: (raw.improvements_made as string[]) ?? [],
      confidenceScore: Number(raw.confidence_score ?? 0),
      placeholderCount: Number(raw.placeholder_count ?? 0),
      readabilityScore: Number(raw.readability_score ?? 0),
      atsKeywordCoverage: Number(raw.ats_keyword_coverage ?? 0),
    }));
  }

  async alignJob(input: JobAlignInput): Promise<JobAlignOutput> {
    const { buildAlignPrompt } = await import("../prompts/align.prompt");
    const { system, user } = buildAlignPrompt(input);
    return this.callAndParse<JobAlignOutput>(system, user, (raw) => {
      const ar = raw.aligned_resume as Record<string, unknown>;
      const ma = raw.match_analysis as Record<string, unknown>;
      const is = raw.interview_strategy as Record<string, unknown>;
      return {
        alignedResume: {
          summary: String(ar?.summary ?? ""),
          experience: (ar?.experience as JobAlignOutput["alignedResume"]["experience"]) ?? [],
          skills: (ar?.skills as JobAlignOutput["alignedResume"]["skills"]) ?? { technical: [], soft: [], priorityOrder: "" },
          newSections: { certificationsSuggested: [], projectsToHighlight: [], ...(ar?.new_sections as object ?? {}) },
        },
        matchAnalysis: {
          overallScore: Number(ma?.overall_score ?? 0),
          keywordCoverage: Number(ma?.keyword_coverage ?? 0),
          experienceAlignment: Number(ma?.experience_alignment ?? 0),
          educationMatch: Number(ma?.education_match ?? 0),
          cultureFit: Number(ma?.culture_fit ?? 0),
          missingRequirements: (ma?.missing_requirements as JobAlignOutput["matchAnalysis"]["missingRequirements"]) ?? [],
          competitiveAdvantages: (ma?.competitive_advantages as string[]) ?? [],
        },
        interviewStrategy: {
          talkingPoints: (is?.talking_points as string[]) ?? [],
          questionsToAsk: (is?.questions_to_ask as string[]) ?? [],
          redFlagsToAvoid: (is?.red_flags_to_avoid as string[]) ?? [],
        },
        honestyFlags: (raw.honesty_flags as string[]) ?? [],
      };
    });
  }

  async scoreJob(input: ScoreInput): Promise<ScoreOutput> {
    const { buildScorePrompt } = await import("../prompts/score.prompt");
    const { system, user } = buildScorePrompt(input);
    return this.callAndParse<ScoreOutput>(system, user, (raw) => raw as unknown as ScoreOutput);
  }

  async evalJob(input: JobEvalInput): Promise<JobEvalOutput> {
    const { buildJobEvalPrompt } = await import("../prompts/job-eval.prompt");
    const { system, user } = buildJobEvalPrompt(input);
    return this.callAndParse<JobEvalOutput>(system, user, (raw) => ({
      recommendation: String(raw.recommendation ?? "weak") as JobEvalOutput["recommendation"],
      matchPercentage: Number(raw.match_percentage ?? 0),
      preferenceAlignment: (raw.preference_alignment as JobEvalOutput["preferenceAlignment"]) ?? { locationMatch: false, remoteMatch: false, salaryMatch: "unknown", companySizeMatch: false },
      keyMatches: (raw.key_matches as string[]) ?? [],
      concerns: (raw.concerns as string[]) ?? [],
      actionItems: (raw.action_items as JobEvalOutput["actionItems"]) ?? { resumeTweaks: [], networkingAngle: "", applicationPriority: "apply_later", coverLetterFocus: "" },
      companyInsights: (raw.company_insights as JobEvalOutput["companyInsights"]) ?? { growthStage: "", hiringVelocity: "", cultureIndicators: [], recentNews: [] },
      competitiveIntel: (raw.competitive_intel as JobEvalOutput["competitiveIntel"]) ?? { estimatedApplicants: 0, daysSincePosted: 0, stillActive: true, recencyScore: 50 },
    }));
  }

  async findContacts(input: ContactInput): Promise<ContactOutput> {
    const { buildContactsPrompt } = await import("../prompts/contacts.prompt");
    const { system, user } = buildContactsPrompt(input);
    return this.callAndParse<ContactOutput>(system, user, (raw) => ({
      primaryContact: (raw.primary_contact as ContactOutput["primaryContact"]) ?? { likelyTitle: "", searchStrategy: "", department: "", priority: 1, rationale: "" },
      secondaryContacts: (raw.secondary_contacts as ContactOutput["secondaryContacts"]) ?? [],
      messageVariants: (raw.message_variants as ContactOutput["messageVariants"]) ?? [],
      followUpSequence: (raw.follow_up_sequence as ContactOutput["followUpSequence"]) ?? [],
      bestPractices: (raw.best_practices as ContactOutput["bestPractices"]) ?? { optimalSendTime: "", connectionNoteLength: "", avoid: [], include: [] },
    }));
  }
}
