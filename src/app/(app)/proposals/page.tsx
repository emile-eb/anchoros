import { FileText } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageIntro } from "@/components/app/page-intro";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProposalSummary } from "@/lib/data/workspace";

export default async function ProposalsPage() {
  const { workspace, proposals } = await getProposalSummary();

  return (
    <div className="space-y-8">
      <PageIntro eyebrow={workspace.name} title="Proposals" description="Proposal tracking already sits on its own typed table with workspace scoping. This page starts minimal and gains depth once live quoting flows are added." />
      {proposals.length === 0 ? (
        <EmptyState icon={<FileText className="size-5" />} title="No proposals yet" description="When your first proposal is created, this screen can surface status, sent date, amount, and the related lead without changing the underlying data model." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent proposals</CardTitle>
            <CardDescription>Latest proposal records in the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-neutral-950">{proposal.leads?.restaurant_name ?? "Untitled proposal"}</p>
                  <p className="text-sm text-neutral-500">{proposal.amount_cents ? `$${(proposal.amount_cents / 100).toLocaleString()}` : "Amount TBD"}</p>
                </div>
                <Badge variant={proposal.status === "sent" ? "warning" : "default"}>{proposal.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
