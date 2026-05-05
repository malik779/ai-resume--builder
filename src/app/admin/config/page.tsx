import { requireAdmin } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { CONFIG_SCHEMA } from "@/lib/config-service";
import { ConfigEditor } from "@/components/admin/ConfigEditor";

export default async function AdminConfigPage() {
  await requireAdmin();

  const dbRows = await prisma.systemConfig.findMany();
  const dbMap = Object.fromEntries(dbRows.map((r) => [r.key, r.value]));

  // Build initial values: DB value takes precedence, mask sensitive
  const groups = Array.from(new Set(CONFIG_SCHEMA.map((s) => s.group)));
  const grouped = groups.map((group) => ({
    group,
    items: CONFIG_SCHEMA.filter((s) => s.group === group).map((s) => ({
      ...s,
      currentValue: dbMap[s.key] ?? null,
      hasDbValue: s.key in dbMap,
    })),
  }));

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-1">System Config</h1>
      <p className="text-gray-400 text-sm mb-8">
        Values set here override <code className="text-gray-300">.env</code> at runtime. Leave blank to use the environment variable.
      </p>
      <ConfigEditor groups={grouped} />
    </div>
  );
}

