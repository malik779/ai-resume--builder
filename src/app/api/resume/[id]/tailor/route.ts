import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { jobDescription, resumeData } = await req.json();
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: `You are an ATS and job matching expert.
Analyze how well the resume matches the job description and return ONLY valid JSON (no markdown, no explanation):
{
  "overallScore": 0-100,
  "keywordsScore": 0-100,
  "skillsScore": 0-100,
  "experienceScore": 0-100,
  "educationScore": 0-100,
  "missingKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
}
Score generously if there is strong overlap. Be realistic about gaps.`,
      messages: [{
        role: "user",
        content: `Job Description:\n${jobDescription}\n\nResume:\n${JSON.stringify({
          personalInfo: resumeData?.personalInfo,
          summary: resumeData?.summary,
          experiences: resumeData?.experiences?.map((e: any) => ({
            title: e.title, company: e.company, bullets: e.bullets,
          })),
          skills: resumeData?.skills?.map((s: any) => s.name),
          educations: resumeData?.educations?.map((e: any) => ({ degree: e.degree, field: e.field })),
        }, null, 2)}`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[tailor]", err);
    return NextResponse.json({ error: err.message ?? "Tailor failed" }, { status: 500 });
  }
}
