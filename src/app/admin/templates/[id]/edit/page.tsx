import { requireAdmin } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { TemplateForm } from "@/components/admin/TemplateForm";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <div className="p-8 max-w-3xl">
      <a href="/admin/templates" className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-flex items-center gap-1">
        ← Back to templates
      </a>
      <h1 className="text-2xl font-bold text-white mb-1">Edit Template</h1>
      <p className="text-gray-400 text-sm mb-8">{template.name}</p>
      <TemplateForm template={template} />
    </div>
  );
}
