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

    const { resumeData } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `You are an expert resume reviewer and ATS specialist.
Analyze the resume and return ONLY a JSON object (no markdown, no explanation):
{
  "overallScore": 0-100,
  "atsScore": 0-100,
  "readabilityScore": 0-100,
  "rating": "Excellent|Good|Needs Work|Incomplete",
  "summary": "2-3 sentence overview of the resume quality",
  "strengths": ["strength 1 — section name", "strength 2 — section name", "strength 3"],
  "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "missingKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}
Base scores on: completeness of sections, quantified achievements, keyword density, formatting consistency, and ATS compatibility.`,
      messages: [{
        role: "user",
        content: `Review this resume:\n${JSON.stringify(resumeData, null, 2)}`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[ai-review]", err);
    return NextResponse.json({ error: err.message ?? "Review failed" }, { status: 500 });
  }
}
