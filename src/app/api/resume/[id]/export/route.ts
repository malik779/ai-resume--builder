import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { gateExport } from "@/lib/features/gate";
import { resumeRepository } from "@/lib/db";
import { err, handleRouteError } from "@/lib/utils/api";

const Schema = z.object({ format: z.enum(["pdf", "docx"]) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    const tier = await getUserTier(userId);
    const gate = gateExport(tier);
    if (!gate.allowed) return err(gate.reason, 402, "UPGRADE_REQUIRED");

    const body = Schema.parse(await req.json());
    const resume = await resumeRepository.findByIdWithRelations(id);
    if (!resume || resume.userId !== userId) return err("Resume not found", 404);

    if (body.format === "pdf") {
      const { generatePDF } = await import("@/lib/pdf/generator");
      const pdfBytes = await generatePDF(resume as Parameters<typeof generatePDF>[0]);
      return new Response(pdfBytes as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(resume.title)}.pdf"`,
        },
      });
    }

    if (body.format === "docx") {
      const { generateDOCX } = await import("@/lib/pdf/generator");
      const docxBytes = await generateDOCX(resume as Parameters<typeof generateDOCX>[0]);
      return new Response(docxBytes as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(resume.title)}.docx"`,
        },
      });
    }

    return err("Invalid format", 400);
  } catch (e) {
    return handleRouteError(e);
  }
}
