import { requireAdmin } from "@/lib/admin-auth";
import { TemplateForm } from "@/components/admin/TemplateForm";

export default async function NewTemplatePage() {
  await requireAdmin();
  return (
    <div className="p-8">
      <a href="/admin/templates" className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-flex items-center gap-1">
        ← Back to templates
      </a>
      <h1 className="text-2xl font-bold text-white mb-1">New Template</h1>
      <p className="text-gray-400 text-sm mb-8">Create an engine-driven template — no code required.</p>
      <TemplateForm />
    </div>
  );
}
