import { requireAdmin } from "@/lib/admin-auth";
import { db as prisma } from "@/lib/db";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam, search = "" } = await searchParams;
  const page = Number(pageParam ?? 1);
  const limit = 50;

  const where = search
    ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { name: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, image: true, role: true, createdAt: true,
        subscription: { select: { tier: true, status: true } },
        _count: { select: { resumes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total.toLocaleString()} total</p>
        </div>
      </div>
      <UserTable
        users={users as Parameters<typeof UserTable>[0]["users"]}
        total={total}
        page={page}
        pages={Math.ceil(total / limit)}
        search={search}
      />
    </div>
  );
}

