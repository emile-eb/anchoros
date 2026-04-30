"use client";

import { CircleOff, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { toast } from "sonner";
import type { Lead } from "@/lib/types/database";
import { updateLeadStageAction } from "@/lib/actions/leads";
import { AddNoteDialog } from "@/components/leads/add-note-dialog";
import { LeadStageSelect } from "@/components/leads/lead-stage-select";
import { LeadUpsertDialog } from "@/components/leads/lead-upsert-dialog";
import { LogOutreachDialog } from "@/components/leads/log-outreach-dialog";
import { LogVisitDialog } from "@/components/leads/log-visit-dialog";
import { Button } from "@/components/ui/button";

export function LeadDetailActions({ lead }: { lead: Lead }) {
  const router = useRouter();

  return (
    <div className="space-y-4 border border-[#e6e8ec] bg-white p-4">
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Actions</p>
        <p className="text-sm text-neutral-500">Update the record, log activity, or move the lead forward.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <LeadUpsertDialog
          mode="edit"
          lead={lead}
          trigger={
            <Button variant="outline">
              <Pencil className="size-4" />
              Edit lead
            </Button>
          }
        />
        <AddNoteDialog leadId={lead.id} />
        <LogOutreachDialog leadId={lead.id} />
        <LogVisitDialog leadId={lead.id} />
        {lead.lead_stage !== "lost" ? (
          <Button
            variant="ghost"
            onClick={() =>
              startTransition(async () => {
                const result = await updateLeadStageAction({
                  lead_id: lead.id,
                  lead_stage: "lost",
                });

                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }

                toast.success("Lead marked lost.");
                router.refresh();
              })
            }
          >
            <CircleOff className="size-4" />
            Mark lost
          </Button>
        ) : null}
      </div>
      <div className="space-y-2 border-t border-[#eceff3] pt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Stage</p>
        <LeadStageSelect leadId={lead.id} value={lead.lead_stage === "qualified" || lead.lead_stage === "on_hold" ? "researching" : lead.lead_stage} />
      </div>
    </div>
  );
}
