import type { ScoreInput } from "../types";

export function buildScorePrompt(input: ScoreInput): { system: string; user: string } {
  return {
    system: `You are a Data-Driven Hiring Manager who has reviewed 10,000+ resumes and tracked outcomes. You combine pattern recognition with labor market intelligence.

SCORING WEIGHTS (must total 100%):
- Hard Skills Match: 30%
- Experience Level & Seniority: 25%
- Industry/Domain Knowledge: 15%
- Education & Certifications: 10%
- Soft Skills & Cultural Fit: 10%
- Resume Quality & Presentation: 10%

SCORE INTERPRETATION:
90-100: Exceptional fit, likely top 5% of applicant pool
70-89:  Strong competitive candidate
50-69:  Moderate fit, needs differentiation
30-49:  Stretch role, significant gaps
0-29:   Fundamental mismatch

CRITICAL: Be realistic but constructive. Consider 2025 tech hiring market conditions (competitive, ATS-heavy, experience requirements inflated). Never give false hope. Always provide genuine actionable improvement path.

OUTPUT: Return ONLY valid JSON. No markdown, no text outside JSON.`,

    user: `Score this candidate's probability of success.

ALIGNED RESUME:
${JSON.stringify(input.alignedResume, null, 2)}

JOB DESCRIPTION:
${input.jobDescription}

${input.companyContext ? `COMPANY CONTEXT: ${JSON.stringify(input.companyContext)}` : ""}
${input.marketData ? `MARKET DATA: ${JSON.stringify(input.marketData)}` : ""}

Return JSON:
{
  "probability_score": 0-100,
  "confidence_level": "high|medium|low",
  "breakdown": {
    "hard_skills": { "score": 0-100, "details": "string", "strengths": ["string"], "gaps": ["string"] },
    "experience": { "score": 0-100, "details": "string", "strengths": ["string"], "gaps": ["string"] },
    "industry_fit": { "score": 0-100, "details": "string", "strengths": ["string"], "gaps": ["string"] },
    "education": { "score": 0-100, "details": "string", "strengths": ["string"], "gaps": ["string"] },
    "soft_skills": { "score": 0-100, "details": "string", "strengths": ["string"], "gaps": ["string"] },
    "resume_quality": { "score": 0-100, "details": "string", "strengths": ["string"], "gaps": ["string"] }
  },
  "probability_ranges": {
    "screening_pass": "X-Y%",
    "interview_probability": "X-Y%",
    "offer_probability": "A-B%"
  },
  "timeline_estimate": {
    "expected_response_days": 0-30,
    "hiring_process_weeks": 0-12,
    "urgency_level": "high|medium|low"
  },
  "competitive_context": {
    "estimated_applicant_pool": "string",
    "your_projected_percentile": "string",
    "key_differentiators": ["string"],
    "common_weaknesses_in_pool": ["string"],
    "why_you_win": "string"
  },
  "improvement_roadmap": [
    { "action": "string", "impact": "high|medium|low", "effort": "string", "cost": "string", "expected_score_bump": 0-20, "priority": 1 }
  ],
  "alternative_paths": [
    { "strategy": "string", "rationale": "string", "target_roles": ["string"] }
  ]
}`,
  };
}
