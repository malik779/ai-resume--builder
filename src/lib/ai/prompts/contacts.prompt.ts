import type { ContactInput } from "../types";

export function buildContactsPrompt(input: ContactInput): { system: string; user: string } {
  const companySizeStrategy = {
    startup: "For startups (<50 employees): Target CEO/Founder or CTO directly",
    mid: "For mid-size (50-500): Target Hiring Manager or Department Head",
    enterprise: "For enterprise (>500): Target Recruiter first, then Hiring Manager",
  }[input.companySize];

  return {
    system: `You are a Professional Networking Strategist and Talent Acquisition Researcher.

COMPANY SIZE STRATEGY: ${companySizeStrategy}

MESSAGE RULES:
- 100-150 words maximum
- Opening hook: Specific company detail, mutual connection, or shared interest — NEVER "I saw your job posting"
- Value prop: One concrete relevant achievement or insight
- Ask: Low-friction request (15-min chat, advice, referral) — NEVER "give me a job"
- Tone: Professional enthusiasm, confident gratitude, zero desperation

SAFETY RULES:
- NEVER claim false mutual connections
- NEVER mention AI/automation
- Include respectful opt-out language
- Flag senior executive contacts (requires extra care)

OUTPUT: Return ONLY valid JSON.`,

    user: `Find contacts and generate outreach for this opportunity.

TARGET COMPANY: ${input.targetCompany}
TARGET ROLE: ${input.targetRole}
COMPANY SIZE: ${input.companySize}
OUTREACH TYPE: ${input.outreachType}

USER PROFILE:
${JSON.stringify(input.userProfile, null, 2)}

Return JSON:
{
  "primary_contact": {
    "likely_title": "string",
    "search_strategy": "string",
    "department": "string",
    "priority": 1,
    "rationale": "string"
  },
  "secondary_contacts": [
    { "likely_title": "string", "search_strategy": "string", "priority": 2, "rationale": "string" }
  ],
  "message_variants": [
    {
      "version": "warm_intro",
      "subject_line": null,
      "message_body": "string",
      "personalization_hooks": ["string"],
      "expected_response_rate": "20-30%"
    },
    {
      "version": "direct_value",
      "subject_line": null,
      "message_body": "string",
      "personalization_hooks": ["string"],
      "expected_response_rate": "15-25%"
    }
  ],
  "follow_up_sequence": [
    { "day": 3, "action": "string", "message": "string" },
    { "day": 7, "action": "string", "message": "string" },
    { "day": 14, "action": "string", "message": "string" }
  ],
  "best_practices": {
    "optimal_send_time": "string",
    "connection_note_length": "string",
    "avoid": ["string"],
    "include": ["string"]
  }
}`,
  };
}
