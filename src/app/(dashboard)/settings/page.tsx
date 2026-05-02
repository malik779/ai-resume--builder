import { auth } from "@/lib/auth/config";
import { userRepository } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Shield, CreditCard, Bell } from "lucide-react";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = await userRepository.findById(session!.user!.id as string);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name ?? "User"}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
              <input defaultValue={user?.name ?? ""} readOnly
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input defaultValue={user?.email ?? ""} readOnly
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Profile updates happen via your OAuth provider (Google/GitHub). Name and email are managed there.
          </p>
        </CardContent>
      </Card>

      {/* Billing shortcut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing & Subscription
          </CardTitle>
          <CardDescription>Manage your plan, invoices, and payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/settings/billing">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" /> Go to Billing
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Authentication Method</p>
              <p className="text-xs text-gray-400">
                {session?.user?.email?.includes("github") ? "GitHub OAuth" : "Google OAuth"}
              </p>
            </div>
            <Badge variant="success" className="text-xs">Active</Badge>
          </div>
          <p className="text-xs text-gray-400">
            Your account is secured via OAuth — no password to manage. Sign in is handled by your provider.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
          <CardDescription>Coming soon — email digests for job matches and application updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Coming soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
