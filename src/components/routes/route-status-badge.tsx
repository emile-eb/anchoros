import { Badge } from "@/components/ui/badge";
import type { RouteStatus } from "@/lib/types/database";
import { startCase } from "@/lib/formatters";

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const className =
    status === "completed"
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
      : status === "in_progress"
        ? "border-neutral-900/10 bg-neutral-900 text-white"
        : status === "ready" || status === "paused"
          ? "border-amber-200/80 bg-amber-50 text-amber-800"
          : "border-neutral-200 bg-neutral-100 text-neutral-700";

  return <Badge className={className}>{startCase(status)}</Badge>;
}
