import { auth } from "@/lib/auth/config";
import { getUserTier } from "@/lib/auth/helpers";
import { gateContactFinder } from "@/lib/features/gate";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, Linkedin, Crown, Plus, ExternalLink, MessageSquare } from "lucide-react";
import { ContactFinderPanel } from "@/components/ai/ContactFinderPanel";

export const metadata = { title: "Contacts & Outreach" };

export default async function ContactsPage() {
  const session = await auth();
  const userId = session!.user!.id as string;
  const tier = await getUserTier(userId);

  const gate = gateContactFinder(tier);

  if (!gate.allowed) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 mx-auto mb-4">
          <Crown className="h-8 w-8 text-purple-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Finder & Outreach</h1>
        <p className="text-gray-500 mb-6">
          Find hiring managers, team leads, and CEOs. Generate personalized LinkedIn outreach messages
          with follow-up sequences and response tracking.
        </p>
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-6 mb-6 text-left">
          {[
            "HR/CEO contact identification",
            "LinkedIn search strategy per contact",
            "Personalized message generation (100-150 words)",
            "3-touch follow-up sequences",
            "Response rate tracking",
          ].map((f) => (
            <p key={f} className="flex items-center gap-2 text-sm text-purple-800 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" /> {f}
            </p>
          ))}
        </div>
        <Link href="/pricing">
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2">
            <Crown className="h-4 w-4" /> Upgrade to Enterprise
          </Button>
        </Link>
      </div>
    );
  }

  const contacts = await db.contact.findMany({
    where: { userId },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts & Outreach</h1>
          <p className="text-gray-500">{contacts.length} contacts tracked</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Finder */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Find New Contact</h2>
          <ContactFinderPanel />
        </div>

        {/* Contact list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Contacts</h2>
          {contacts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12">
                <Users className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No contacts yet — use the finder to identify hiring managers</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold shrink-0">
                        {(contact.name ?? contact.likelyTitle)[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 text-sm truncate">{contact.name ?? contact.likelyTitle}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">P{contact.priority}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{contact.likelyTitle} · {contact.company}</p>
                        {contact.department && <p className="text-xs text-gray-400">{contact.department}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Linkedin className="h-3 w-3" /> LinkedIn
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {contact.messages.length > 0 ? "View Messages" : "Send Message"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
