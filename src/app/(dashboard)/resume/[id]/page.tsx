import { notFound } from "next/navigation";
import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { resumeRepository } from "@/lib/db";
import { getTierConfig } from "@/lib/features/tiers";
import { ResumeEditor } from "@/components/resume/ResumeEditor";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const resume = await resumeRepository.findById(id);
  return { title: resume?.title ?? "Resume Editor" };
}

export default async function ResumeEditorPage({ params }: Params) {
  const { id } = await params;
  const session = await requireAuth();

  const [resume, tier] = await Promise.all([
    resumeRepository.findByIdWithRelations(id),
    getUserTier(session.user.id),
  ]);

  if (!resume || resume.userId !== session.user.id) notFound();

  const config = getTierConfig(tier);

  return (
    <ResumeEditor
      resumeData={resume!}
      canExport={config.pdfExport}
      watermark={config.watermark}
    />
  );
}
