import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { resumeRepository } from "@/lib/db";
import prisma from "@/lib/db/client";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const PARSE_SYSTEM = `You are an expert resume parser. Extract ALL resume data into the exact JSON schema provided.
Rules:
- Extract every piece of data, no matter how small
- Preserve exact dates, company names, job titles as written
- Each achievement bullet = one array item
- If a field is genuinely missing: use null or empty string (never fabricate)
- Detect "Present"/"current" end dates → set current: true, endDate: ""
- Return ONLY valid JSON, no markdown fences, no explanation`;

const RESUME_SCHEMA = {
  personalInfo: { firstName: "", lastName: "", headline: "", email: "", phone: "", location: "", linkedinUrl: "", githubUrl: "", portfolioUrl: "" },
  summary: "",
  experiences: [{ company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [] }],
  educations: [{ institution: "", degree: "", field: "", startDate: "", endDate: "", current: false, gpa: "", honors: "" }],
  skills: [{ name: "" }],
  certifications: [{ name: "", issuer: "", date: "" }],
  languages: [{ name: "", proficiency: "professional" }],
  awards: [{ title: "", issuer: "", date: "", description: "" }],
};

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // Use Claude's vision capabilities for PDF parsing
  // Convert to base64
  const base64 = Buffer.from(buffer).toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: [{
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      }, {
        type: "text",
        text: "Extract all text content from this resume PDF. Return the raw text only, preserving structure with newlines.",
      }],
    }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    let rawText = "";

    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDOCX = file.type.includes("wordprocessingml") || file.name.endsWith(".docx") || file.name.endsWith(".doc");

    if (isPDF) {
      rawText = await extractTextFromPDF(buffer);
    } else if (isDOCX) {
      // For DOCX, decode the raw text (basic extraction — install mammoth for better results)
      rawText = Buffer.from(buffer).toString("utf-8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    } else {
      rawText = Buffer.from(buffer).toString("utf-8");
    }

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "Could not extract text from the file. Try a different format." }, { status: 422 });
    }

    // AI parsing with Claude
    const parseResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: PARSE_SYSTEM,
      messages: [{
        role: "user",
        content: `Parse this resume into JSON:\n\n${rawText}\n\nSchema:\n${JSON.stringify(RESUME_SCHEMA, null, 2)}`,
      }],
    });

    const jsonText = parseResponse.content[0].type === "text" ? parseResponse.content[0].text : "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "Failed to parse resume structure. Please try again." }, { status: 422 });
    }

    // Count extracted fields for the UI
    const fieldsExtracted = countFields(parsed);

    // Create resume in DB
    const title = [parsed.personalInfo?.firstName, parsed.personalInfo?.lastName].filter(Boolean).join(" ")
      + (parsed.personalInfo?.headline ? ` — ${parsed.personalInfo.headline}` : " Resume");

    const created = await resumeRepository.create({
      user: { connect: { id: session.user.id } },
      title: title || "Imported Resume",
      templateId: "classic",
      personalInfo: parsed.personalInfo ?? {},
      summary: parsed.summary ?? "",
    });

    // Persist experiences directly via DB (avoid internal HTTP call)
    if (parsed.experiences?.length > 0) {

      await Promise.all(
        parsed.experiences.slice(0, 20).map((exp: any, i: number) =>
          prisma.workExperience.create({
            data: {
              resumeId: created.id,
              company: exp.company || "",
              title: exp.title || "",
              location: exp.location || "",
              startDate: exp.startDate || "",
              endDate: exp.endDate || "",
              current: Boolean(exp.current),
              bullets: exp.bullets ?? [],
              order: i,
            },
          }).catch(() => null)
        )
      );
    }

    if (parsed.educations?.length > 0) {

      await Promise.all(
        parsed.educations.slice(0, 10).map((edu: any, i: number) =>
          prisma.education.create({
            data: {
              resumeId: created.id,
              institution: edu.institution || "",
              degree: edu.degree || "",
              field: edu.field || "",
              startDate: edu.startDate || "",
              endDate: edu.endDate || "",
              current: Boolean(edu.current),
              gpa: edu.gpa || "",
              honors: edu.honors || "",
              order: i,
            },
          }).catch(() => null)
        )
      );
    }

    return NextResponse.json({ resumeId: created.id, fieldsExtracted });
  } catch (err: any) {
    console.error("[parse-resume]", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

function countFields(parsed: any): number {
  let count = 0;
  const pi = parsed?.personalInfo ?? {};
  count += Object.values(pi).filter((v) => v && String(v).trim()).length;
  if (parsed?.summary?.length > 10) count++;
  count += (parsed?.experiences?.length ?? 0) * 3;
  count += (parsed?.educations?.length ?? 0) * 2;
  count += (parsed?.skills?.length ?? 0);
  count += (parsed?.certifications?.length ?? 0);
  return count;
}
