import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-auto ml-60">
        {children}
      </main>
    </div>
  );
}
