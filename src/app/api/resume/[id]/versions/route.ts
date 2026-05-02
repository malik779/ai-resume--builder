import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { resumeRepository } from "@/lib/db";
import { ok, err, handleRouteError } from "@/lib/utils/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const resume = await resumeRepository.findByIdAndUser(id, session.user.id);
    if (!resume) return err("Resume not found", 404);

    const versions = await resumeRepository.listVersions(id);
    return ok(versions);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { label } = await req.json().catch(() => ({}));

    const resume = await resumeRepository.findByIdAndUser(id, session.user.id);
    if (!resume) return err("Resume not found", 404);

    const version = await resumeRepository.createVersion(id, label);
    return ok(version);
  } catch (e) {
    return handleRouteError(e);
  }
}
