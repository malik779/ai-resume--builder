import { requireAdmin } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { TemplateAdminList } from "@/components/admin/TemplateAdminList";

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const templates = await prisma.template.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-gray-400 text-sm mt-0.5">{templates.length} total · {templates.filter(t => t.isActive).length} active</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/templates/new"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Template
          </a>
        </div>
      </div>
      <TemplateAdminList templates={templates} />
    </div>
  );
}

