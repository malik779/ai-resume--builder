import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UpgradeRequiredError } from "@/lib/auth/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Standardized API response helpers — all routes use these for consistency
// ─────────────────────────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function err(message: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof UpgradeRequiredError) {
    return NextResponse.json(
      { success: false, error: error.message, code: "UPGRADE_REQUIRED", requiredTier: error.requiredTier },
      { status: 402 }
    );
  }
  if (error instanceof ZodError) {
    return err(error.errors.map((e) => e.message).join(", "), 422, "VALIDATION_ERROR");
  }
  if (error instanceof Error) {
    return err(error.message, 500, "INTERNAL_ERROR");
  }
  return err("Unknown error", 500);
}
