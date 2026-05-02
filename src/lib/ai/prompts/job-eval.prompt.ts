import type { JobEvalInput } from "../types";

export function buildJobEvalPrompt(input: JobEvalInput): { system: string; user: string } {
  return {
    system: `You are a Job Market Intelligence Analyst combining data analysis with predictive matching. Your role is to evaluate a job opportunity against a user's profile and preferences, then give a clear recommendation.

EVALUATION CRITERIA:
1. Semantic + exact skill match against user profile
2. Preference alignment (location, remote, salary, company size)
3. Company signals (growth stage, funding, hiring velocity)
4. Competitive context (applicant count, posting recency)

THRESHOLD: Only recommend jobs above ${input.userThreshold}% match. Below threshold → "reject" recommendation.

OUTPUT: Return ONLY valid JSON. No markdown.`,

    user: `Evaluate this job opportunity.

JOB DATA:
${JSON.stringify(input.jobData, null, 2)}

USER PROFILE:
${JSON.stringify(input.userProfile, null, 2)}

USER PREFERENCES:
${JSON.stringify(input.userPreferences, null, 2)}

MATCH THRESHOLD: ${input.userThreshold}%

Return JSON:
{
  "recommendation": "strong|moderate|weak|reject",
  "match_percentage": 0-100,
  "preference_alignment": {
    "location_match": true,
    "remote_match": true,
    "salary_match": true,
    "company_size_match": true
  },
  "key_matches": ["string"],
  "concerns": ["string"],
  "action_items": {
    "resume_tweaks": ["string"],
    "networking_angle": "string",
    "application_priority": "apply_now|apply_this_week|apply_later|skip",
    "cover_letter_focus": "string"
  },
  "company_insights": {
    "growth_stage": "string",
    "hiring_velocity": "string",
    "culture_indicators": ["string"],
    "recent_news": ["string"]
  },
  "competitive_intel": {
    "estimated_applicants": 0,
    "days_since_posted": 0,
    "still_active": true,
    "recency_score": 0-100
  }
}`,
  };
}
