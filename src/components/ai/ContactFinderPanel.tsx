"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { Users, Loader2, Copy, Check, Linkedin } from "lucide-react";
import type { ContactOutput } from "@/lib/ai/types";

export function ContactFinderPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContactOutput | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [form, setForm] = useState({
    targetCompany: "",
    targetRole: "",
    companySize: "mid" as "startup" | "mid" | "enterprise",
    userName: "",
    userRole: "",
    userAchievement: "",
    outreachType: "networking" as "application_followup" | "networking" | "referral_request" | "informational",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFind = async () => {
    if (!form.targetCompany || !form.targetRole || !form.userName) {
      toast({ title: "Fill in company, role, and your name", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCompany: form.targetCompany,
          targetRole: form.targetRole,
          companySize: form.companySize,
          userProfile: {
            name: form.userName,
            currentRole: form.userRole,
            keyAchievement: form.userAchievement,
            mutualConnections: [],
          },
          outreachType: form.outreachType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json.data);
    } catch (e) {
      toast({ title: "Contact finder failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Target Company</label>
              <input value={form.targetCompany} onChange={set("targetCompany")} placeholder="Stripe"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Target Role</label>
              <input value={form.targetRole} onChange={set("targetRole")} placeholder="Senior Engineer"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Company Size</label>
              <select value={form.companySize} onChange={set("companySize")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
                <option value="startup">Startup (&lt;50)</option>
                <option value="mid">Mid-size (50-500)</option>
                <option value="enterprise">Enterprise (&gt;500)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Outreach Type</label>
              <select value={form.outreachType} onChange={set("outreachType")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
                <option value="networking">Networking</option>
                <option value="application_followup">App Follow-up</option>
                <option value="referral_request">Referral Request</option>
                <option value="informational">Informational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Your Name</label>
            <input value={form.userName} onChange={set("userName")} placeholder="Jane Smith"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Your Current Role</label>
            <input value={form.userRole} onChange={set("userRole")} placeholder="Software Engineer at Acme"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Key Achievement</label>
            <input value={form.userAchievement} onChange={set("userAchievement")} placeholder="Built a system serving 5M users"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
          </div>

          <Button onClick={handleFind} disabled={loading} className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? "Finding contacts..." : "Find Contacts & Generate Messages"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-3 animate-fade-in">
          {/* Primary contact */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-900">Primary Target</p>
                <Badge variant="enterprise" className="text-[10px]">Priority 1</Badge>
              </div>
              <p className="font-bold text-gray-900">{result.primaryContact.likelyTitle}</p>
              <p className="text-xs text-gray-600 mt-1">{result.primaryContact.department}</p>
              <p className="text-xs text-gray-500 mt-1 italic">{result.primaryContact.rationale}</p>
              <div className="mt-2 rounded-md bg-white border border-purple-200 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-500 mb-0.5">LinkedIn Search Strategy</p>
                <p className="text-xs text-gray-700">{result.primaryContact.searchStrategy}</p>
              </div>
            </CardContent>
          </Card>

          {/* Message variants */}
          {result.messageVariants.map((variant, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{variant.version.replace("_", " ")}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{variant.expectedResponseRate} response</Badge>
                    <button onClick={() => copyMessage(variant.messageBody, i)}
                      className="rounded p-1 text-gray-400 hover:text-gray-600">
                      {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border">
                  {variant.messageBody}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Best practices */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-green-800 mb-1">
                Best time to send: {result.bestPractices.optimalSendTime}
              </p>
              <p className="text-xs text-green-700">
                LinkedIn note limit: {result.bestPractices.connectionNoteLength}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
