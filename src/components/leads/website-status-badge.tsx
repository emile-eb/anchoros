import type { WebsiteStatus } from "@/lib/types/database";
import { startCase } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

const websiteClassMap: Record<WebsiteStatus, string> = {
  no_website: "border-[#e6d4ad] bg-[#fbf7ed] text-[#8b6528]",
  outdated_website: "border-[#e5e7eb] bg-[#f4f4f5] text-[#52525b]",
  decent_website: "border-[#dfe3e8] bg-[#f8fafc] text-[#52525b]",
  strong_website: "border-[#d7e6de] bg-[#f3faf6] text-[#33624a]",
  unknown: "border-[#e5e7eb] bg-[#f8fafc] text-[#52525b]",
};

export function WebsiteStatusBadge({ status }: { status: WebsiteStatus }) {
  return <Badge className={websiteClassMap[status]}>{startCase(status)}</Badge>;
}
