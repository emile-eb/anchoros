import { Building2, ShieldCheck, Users } from "lucide-react";
import { PageIntro } from "@/components/app/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettingsSummary } from "@/lib/data/workspace";

export default async function SettingsPage() {
  const { workspace, profile, membership, members } = await getSettingsSummary();

  return (
    <div className="space-y-8">
      <PageIntro eyebrow={workspace.name} title="Settings" description="Workspace access and member roles are intentionally simple in Phase 1. Everyone signs into the shared company workspace seeded in the migration." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Core account and membership context for this phase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
              <Building2 className="mt-0.5 size-5 text-neutral-700" />
              <div>
                <p className="font-medium text-neutral-950">{workspace.name}</p>
                <p className="text-sm text-neutral-500">Slug: {workspace.slug}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
              <ShieldCheck className="mt-0.5 size-5 text-neutral-700" />
              <div>
                <p className="font-medium text-neutral-950">{profile.full_name ?? profile.email}</p>
                <p className="text-sm text-neutral-500 capitalize">Role: {membership.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Current members attached to the seeded Anchor Studios workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-2 text-neutral-700">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-950">{member.profiles?.full_name ?? member.profiles?.email}</p>
                    <p className="text-sm text-neutral-500">{member.profiles?.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === "owner" ? "success" : "default"}>{member.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
