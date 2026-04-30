import type { LeadStage } from "@/lib/types/database";
import { startCase } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const stageVariantMap: Record<LeadStage, string> = {
  new: "border-[#e5e7eb] bg-[#f8fafc] text-[#52525b]",
  researching: "border-[#e5e7eb] bg-[#f4f4f5] text-[#52525b]",
  contacted: "border-[#dfe3e8] bg-[#f8fafc] text-[#3f3f46]",
  follow_up: "border-[#ead9b8] bg-[#fcf8ef] text-[#8a642a]",
  meeting_scheduled: "border-[#e4e4e7] bg-[#f4f4f5] text-[#52525b]",
  proposal_sent: "border-[#dfe3e8] bg-[#f5f7fa] text-[#3f3f46]",
  won: "border-[#d7e6de] bg-[#f3faf6] text-[#33624a]",
  lost: "border-[#edd8dc] bg-[#fdf5f6] text-[#9a4f57]",
  qualified: "border-[#e5e7eb] bg-[#f4f4f5] text-[#52525b]",
  on_hold: "border-[#ead9b8] bg-[#fcf8ef] text-[#8a642a]",
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Badge className={stageVariantMap[stage]}>{startCase(stage)}</Badge>;
}
