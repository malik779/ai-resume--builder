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

    const { messages, resumeData } = await req.json();

    const pi = resumeData?.personalInfo ?? {};
    const systemPrompt = `You are an expert resume writer and career coach. Help users improve their resume content.

Current resume context:
- Name: ${pi.firstName ?? ""} ${pi.lastName ?? ""}
- Title: ${pi.headline ?? "Not specified"}
- Experiences: ${resumeData?.experiences?.length ?? 0} positions
- Education: ${resumeData?.educations?.length ?? 0} entries
- Skills: ${resumeData?.skills?.slice(0, 8).map((s: any) => s.name).join(", ") ?? "None listed"}

Guidelines:
- Be concise and actionable
- When making specific edits, wrap them in: <suggestion>{"title": "Section — What changed", "content": "The exact improved text", "section": "summary|experience|skills"}</suggestion>
- One suggestion per block
- Lead with the most impactful change first
- Use strong action verbs, quantified achievements, industry keywords`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: systemPrompt,
      messages: (messages as any[]).slice(-10).map((m: any) => ({
        role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract <suggestion> blocks
    const suggestions: { id: string; title: string; content: string; section?: string }[] = [];
    const regex = /<suggestion>([\s\S]*?)<\/suggestion>/g;
    let match: RegExpExecArray | null;
    let cleanMessage = text;

    while ((match = regex.exec(text)) !== null) {
      try {
        const sug = JSON.parse(match[1].trim());
        suggestions.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...sug });
        cleanMessage = cleanMessage.replace(match[0], "");
      } catch { /* skip malformed */ }
    }

    return NextResponse.json({ message: cleanMessage.trim(), suggestions });
  } catch (err: any) {
    console.error("[ai-chat]", err);
    return NextResponse.json({ error: err.message ?? "Chat failed" }, { status: 500 });
  }
}
