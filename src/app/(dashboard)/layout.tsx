import { requireAuth, getUserTier } from "@/lib/auth/helpers";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { UpgradeModal } from "@/components/layout/UpgradeModal";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const tier = await getUserTier(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userTier={tier} />
      <DashboardHeader />
      <UpgradeModal />
      <main className="pt-16 transition-all duration-300 pl-60">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
