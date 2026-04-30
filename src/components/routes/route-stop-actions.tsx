"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateRouteStopAction } from "@/lib/actions/routes";
import type { RouteStopDetail } from "@/lib/data/routes";
import type { RouteStopStatus, VisitOutcome } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_OUTCOMES: Array<{ label: string; status: RouteStopStatus; outcome: VisitOutcome | null }> = [
  { label: "Set active", status: "active", outcome: null },
  { label: "Visited", status: "completed", outcome: null },
  { label: "Spoke to owner", status: "completed", outcome: "spoke_to_owner" },
  { label: "Spoke to staff", status: "completed", outcome: "staff_only" },
  { label: "Left card", status: "completed", outcome: "left_card" },
  { label: "Owner not there", status: "completed", outcome: "owner_not_there" },
  { label: "Revisit needed", status: "revisit_needed", outcome: "revisit_needed" },
  { label: "Skip stop", status: "skipped", outcome: null },
];

const PRIMARY_COMPACT_ACTIONS = new Set([
  "Visited",
  "Spoke to owner",
  "Left card",
  "Revisit needed",
]);

export function RouteStopActions({
  stop,
  routeId,
  compact = false,
}: {
  stop: RouteStopDetail;
  routeId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(stop.notes ?? "");
  const [isPending, setIsPending] = useState(false);

  const runUpdate = (status: RouteStopStatus, outcome: VisitOutcome | null) => {
    if (isPending) return;
    setIsPending(true);
    startTransition(async () => {
      const result = await updateRouteStopAction({
        routeId,
        routeStopId: stop.id,
        status,
        visitOutcome: outcome,
        notes: note,
      });
      setIsPending(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route stop updated.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2.5">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a quick field note"
      />
      <div className={compact ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"}>
        {(compact ? QUICK_OUTCOMES.filter((action) => PRIMARY_COMPACT_ACTIONS.has(action.label)) : QUICK_OUTCOMES).map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.status === "active" ? "outline" : "default"}
            className={compact ? "justify-center px-2 text-[11px]" : undefined}
            disabled={isPending}
            onClick={() => runUpdate(action.status, action.outcome)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {compact ? (
        <details className="rounded-md border border-[#eceff3] bg-[#fafbfc] px-3 py-2">
          <summary className="cursor-pointer list-none text-[11px] font-medium text-neutral-600">
            More outcomes
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {QUICK_OUTCOMES.filter((action) => !PRIMARY_COMPACT_ACTIONS.has(action.label)).map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.status === "active" ? "outline" : "outline"}
                className="justify-center px-2 text-[11px]"
                disabled={isPending}
                onClick={() => runUpdate(action.status, action.outcome)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </details>
      ) : null}
      {!compact ? (
        <p className="text-xs text-neutral-400">
          Updating a stop also advances route progress and writes visit history back to the CRM when a lead is linked.
        </p>
      ) : null}
    </div>
  );
}
