import type { LeadPriority } from "@/lib/types/database";
import { startCase } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const priorityClassMap: Record<LeadPriority, string> = {
  low: "border-[#e5e7eb] bg-[#f8fafc] text-[#52525b]",
  medium: "border-[#ead9b8] bg-[#fcf8ef] text-[#8a642a]",
  high: "border-[#edd8dc] bg-[#fdf5f6] text-[#9a4f57]",
};

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  return <Badge className={priorityClassMap[priority]}>{startCase(priority)}</Badge>;
}
