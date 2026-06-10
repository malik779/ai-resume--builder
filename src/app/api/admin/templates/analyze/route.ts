import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getResumeActionRegistry } from "@/domains/resume/server/runtime";
import { ACTION_IDS } from "@/domains/resume/action-ids";
import type { IngestTemplateScreenshotOutput } from "@/domains/resume/actions";
import { sessionId, type ActionContext } from "@/ai-core";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image field" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Use JPEG, PNG, GIF, or WebP.` },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be ≤ 5 MB" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

  const ctx: ActionContext = {
    userId: session.user?.id,
    sessionId: sessionId("admin-ingest"),
  };

  const result = await getResumeActionRegistry().execute<
    { imageBase64: string; mediaType: string },
    IngestTemplateScreenshotOutput
  >(
    ACTION_IDS.INGEST_TEMPLATE_SCREENSHOT,
    { imageBase64, mediaType: file.type },
    ctx,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(result.output);
}
