// ─────────────────────────────────────────────────────────────────────────────
// AI Provider contract — all providers implement this interface.
// Swapping models requires zero changes to calling code.
// ─────────────────────────────────────────────────────────────────────────────

export type HonestyLevel = "strict" | "moderate" | "creative";
export type SectionType = "summary" | "experience" | "skills" | "education" | "projects";

// ── Prompt 1: Enhancement ────────────────────────────────────────────────────

export interface EnhanceInput {
  sectionType: SectionType;
  currentContent: string;
  targetRole?: string;
  yearsExperience?: number;
  honestyLevel?: HonestyLevel;
}

export interface EnhanceOutput {
  enhancedContent: string;
  suggestedKeywords: string[];
  improvementsMade: string[];
  confidenceScore: number;
  placeholderCount: number;
  readabilityScore: number;
  atsKeywordCoverage: number;
}

// ── Prompt 2: Job Alignment ──────────────────────────────────────────────────

export interface JobAlignInput {
  resumeJson: Record<string, unknown>;
  jobDescription: string;
  companyInfo?: { size?: string; industry?: string; stage?: string; cultureNotes?: string };
  honestyLevel?: HonestyLevel;
  emphasis?: "balanced" | "skills" | "experience" | "leadership";
}

export interface JobAlignOutput {
  alignedResume: {
    summary: string;
    experience: Array<{
      company: string;
      title: string;
      dateRange: string;
      bullets: string[];
      relevanceScore: number;
    }>;
    skills: { technical: string[]; soft: string[]; priorityOrder: string };
    newSections: { certificationsSuggested: string[]; projectsToHighlight: string[] };
  };
  matchAnalysis: {
    overallScore: number;
    keywordCoverage: number;
    experienceAlignment: number;
    educationMatch: number;
    cultureFit: number;
    missingRequirements: Array<{ requirement: string; severity: "critical" | "preferred" | "nice-to-have"; mitigation: string }>;
    competitiveAdvantages: string[];
  };
  interviewStrategy: {
    talkingPoints: string[];
    questionsToAsk: string[];
    redFlagsToAvoid: string[];
  };
  honestyFlags: string[];
}

// ── Prompt 3: Probability Score ───────────────────────────────────────────────

export interface ScoreInput {
  alignedResume: JobAlignOutput["alignedResume"];
  jobDescription: string;
  companyContext?: { size?: string; industry?: string; hiringVelocity?: string; competitionLevel?: string };
  marketData?: { roleSeniority?: string; avgApplicants?: number; marketDemand?: string };
}

export interface ScoreOutput {
  probabilityScore: number;
  confidenceLevel: "high" | "medium" | "low";
  breakdown: Record<string, { score: number; details: string; strengths: string[]; gaps: string[] }>;
  probabilityRanges: { screeningPass: string; interviewProbability: string; offerProbability: string };
  timelineEstimate: { expectedResponseDays: number; hiringProcessWeeks: number; urgencyLevel: "high" | "medium" | "low" };
  competitiveContext: {
    estimatedApplicantPool: string;
    yourProjectedPercentile: string;
    keyDifferentiators: string[];
    commonWeaknessesInPool: string[];
    whyYouWin: string;
  };
  improvementRoadmap: Array<{ action: string; impact: "high" | "medium" | "low"; effort: string; cost: string; expectedScoreBump: number; priority: number }>;
  alternativePaths: Array<{ strategy: string; rationale: string; targetRoles: string[] }>;
}

// ── Prompt 4: LinkedIn Job Intelligence ─────────────────────────────────────

export interface JobEvalInput {
  jobData: { title: string; company: string; description: string; requirements?: string[]; postedDate?: string; applicantsCount?: number; url: string };
  userProfile: Record<string, unknown>;
  userPreferences: { remote?: boolean; salaryRange?: string; location?: string; companySize?: string };
  userThreshold: 50 | 70 | 100;
}

export interface JobEvalOutput {
  recommendation: "strong" | "moderate" | "weak" | "reject";
  matchPercentage: number;
  preferenceAlignment: { locationMatch: boolean; remoteMatch: boolean; salaryMatch: boolean | "unknown"; companySizeMatch: boolean };
  keyMatches: string[];
  concerns: string[];
  actionItems: { resumeTweaks: string[]; networkingAngle: string; applicationPriority: "apply_now" | "apply_this_week" | "apply_later" | "skip"; coverLetterFocus: string };
  companyInsights: { growthStage: string; hiringVelocity: string; cultureIndicators: string[]; recentNews: string[] };
  competitiveIntel: { estimatedApplicants: number; daysSincePosted: number; stillActive: boolean; recencyScore: number };
}

// ── Prompt 5: Contact Finder & Outreach ─────────────────────────────────────

export interface ContactInput {
  targetCompany: string;
  targetRole: string;
  companySize: "startup" | "mid" | "enterprise";
  userProfile: { name: string; currentRole: string; keyAchievement: string; mutualConnections: string[] };
  outreachType: "application_followup" | "networking" | "referral_request" | "informational";
}

export interface ContactOutput {
  primaryContact: { likelyTitle: string; searchStrategy: string; department: string; priority: number; rationale: string };
  secondaryContacts: Array<{ likelyTitle: string; searchStrategy: string; priority: number; rationale: string }>;
  messageVariants: Array<{
    version: string;
    subjectLine: string | null;
    messageBody: string;
    personalizationHooks: string[];
    expectedResponseRate: string;
  }>;
  followUpSequence: Array<{ day: number; action: string; message: string }>;
  bestPractices: { optimalSendTime: string; connectionNoteLength: string; avoid: string[]; include: string[] };
}

// ── Provider interface ───────────────────────────────────────────────────────

export interface IAIProvider {
  readonly modelId: string;
  enhance(input: EnhanceInput): Promise<EnhanceOutput>;
  alignJob(input: JobAlignInput): Promise<JobAlignOutput>;
  scoreJob(input: ScoreInput): Promise<ScoreOutput>;
  evalJob(input: JobEvalInput): Promise<JobEvalOutput>;
  findContacts(input: ContactInput): Promise<ContactOutput>;
}

export interface AICallMeta {
  promptTokens: number;
  outputTokens: number;
  durationMs: number;
  costUsd: number;
}
