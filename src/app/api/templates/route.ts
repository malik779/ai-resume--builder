import { NextResponse } from "next/server";
import { getActiveTemplates } from "@/lib/template-service";

export async function GET() {
  const templates = await getActiveTemplates();
  return NextResponse.json(templates);
}
