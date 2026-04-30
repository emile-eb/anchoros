"use client";

import Link from "next/link";
import type { Route } from "next";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WebsiteStatusBadge } from "@/components/leads/website-status-badge";
import { LeadStageBadge } from "@/components/leads/lead-stage-badge";
import { RouteStopStatusBadge } from "@/components/routes/route-stop-status-badge";
import { RouteStopActions } from "@/components/routes/route-stop-actions";
import type { RouteStopDetail } from "@/lib/data/routes";
import { formatDateTime, startCase } from "@/lib/formatters";

export function RouteStopSheet({
  stop,
  routeId,
  open,
  onOpenChange,
}: {
  stop: RouteStopDetail | null;
  routeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!stop) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0 inset-x-0 bottom-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-xl rounded-b-none border-x-0 border-b-0 md:inset-auto md:max-w-xl md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border">
        <div className="border-b border-[#eceff3] px-4 py-4 md:px-6 md:py-5">
          <DialogTitle>{stop.restaurant_name ?? "Route stop"}</DialogTitle>
          <DialogDescription className="mt-1">
            {stop.formatted_address ?? "Address not set"}
          </DialogDescription>
        </div>
        <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
          <div className="flex flex-wrap gap-2">
            <RouteStopStatusBadge status={stop.status} />
            {stop.lead?.lead_stage ? <LeadStageBadge stage={stop.lead.lead_stage} /> : null}
            {stop.lead?.website_status ? <WebsiteStatusBadge status={stop.lead.website_status} /> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Linked lead</p>
              {stop.lead ? (
                <Link
                  href={`/leads/${stop.lead.id}` as Route}
                  className="mt-2 inline-block font-medium text-neutral-950 hover:text-neutral-700"
                >
                  {stop.lead.restaurant_name}
                </Link>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">No CRM lead linked yet</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Phone</p>
              <p className="mt-2 text-sm text-neutral-600">{stop.lead?.phone ?? "Not available"}</p>
            </div>
          </div>

          <div className="border border-[#eceff3] bg-[#fafbfc] px-4 py-3.5">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Latest visit</p>
            {stop.latestVisit ? (
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                <p>{formatDateTime(stop.latestVisit.visited_at)}</p>
                <p>{stop.latestVisit.outcome ? startCase(stop.latestVisit.outcome) : "Outcome not set"}</p>
                <p>{stop.latestVisit.notes ?? "No note on the latest visit."}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">No visit history yet for this stop.</p>
            )}
          </div>

          <RouteStopActions stop={stop} routeId={routeId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
