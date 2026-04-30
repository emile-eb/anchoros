import { Badge } from "@/components/ui/badge";
import type { RouteStopStatus } from "@/lib/types/database";
import { startCase } from "@/lib/formatters";

export function RouteStopStatusBadge({ status }: { status: RouteStopStatus }) {
  const className =
    status === "completed" || status === "visited"
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
      : status === "active"
        ? "border-neutral-900/10 bg-neutral-900 text-white"
        : status === "revisit_needed"
          ? "border-amber-200/80 bg-amber-50 text-amber-800"
          : status === "skipped"
            ? "border-stone-200 bg-stone-100 text-stone-700"
            : "border-neutral-200 bg-neutral-100 text-neutral-700";

  return <Badge className={className}>{startCase(status)}</Badge>;
}
