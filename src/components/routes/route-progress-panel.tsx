"use client";

import { Archive, ExternalLink, MoreHorizontal, Pause, Play, RefreshCw, StopCircle } from "lucide-react";
import type { Route } from "next";
import { startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  archiveRouteAction,
  completeRouteAction,
  pauseRouteAction,
  regenerateRouteAction,
  startRouteAction,
} from "@/lib/actions/routes";
import type { RouteDetail, RouteStopDetail } from "@/lib/data/routes";
import { formatDateTime, formatDistanceMeters, formatDurationMinutes, startCase } from "@/lib/formatters";
import { RouteStatusBadge } from "@/components/routes/route-status-badge";
import { RouteStopActions } from "@/components/routes/route-stop-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function RouteProgressPanel({
  route,
  stops,
  googleMapsUrl,
  googleMapsWarning,
  nextStop,
  onOpenStop,
}: {
  route: RouteDetail;
  stops: RouteStopDetail[];
  googleMapsUrl: string | null;
  googleMapsWarning: string | null;
  nextStop: RouteStopDetail | null;
  onOpenStop: (stopId: string) => void;
}) {
  const router = useRouter();
  const completedCount = stops.filter((stop) =>
    ["completed", "visited", "skipped", "revisit_needed"].includes(stop.status),
  ).length;
  const remainingCount = Math.max(stops.length - completedCount, 0);

  const runAction = (runner: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    startTransition(async () => {
      const result = await runner();
      if (!result.ok) {
        toast.error(result.error ?? "Action failed.");
        return;
      }
      toast.success(success);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 xl:sticky xl:top-24">
      <div className="border border-[#e6e8ec] bg-white p-4 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Route session</p>
            <h3 className="mt-1 truncate text-[1.15rem] font-semibold tracking-[-0.04em] text-neutral-950">{route.name}</h3>
          </div>
          <RouteStatusBadge status={route.status} />
        </div>
        <div className="mt-3 flex items-center gap-3 border-y border-[#eef1f4] py-2.5 text-[11px] text-neutral-500">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">Done</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-950">{completedCount}</p>
          </div>
          <div className="h-6 w-px bg-[#eceff3]" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">Left</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-950">{remainingCount}</p>
          </div>
          <div className="h-6 w-px bg-[#eceff3]" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">Drive</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-950">{formatDurationMinutes(route.estimated_duration_minutes)}</p>
          </div>
        </div>
        <div className="mt-3 rounded-md border border-neutral-900 bg-white px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Next stop</p>
              {nextStop ? (
                <>
                  <p className="mt-1 truncate text-[1rem] font-semibold tracking-[-0.03em] text-neutral-950">{nextStop.restaurant_name}</p>
                  <p className="mt-1 text-[12px] leading-4 text-neutral-500">{nextStop.formatted_address ?? "Address not set"}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-neutral-500">All stops resolved.</p>
              )}
            </div>
            {nextStop ? (
              <Button size="sm" onClick={() => onOpenStop(nextStop.id)}>Open</Button>
            ) : null}
          </div>
          {nextStop ? (
            <>
              <div className="mt-2.5 flex items-center gap-2">
                {nextStop.lead ? (
                  <Button asChild size="sm" variant="outline" className="flex-1 justify-center">
                    <Link href={`/leads/${nextStop.lead.id}` as Route}>Open lead</Link>
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" className="flex-1 justify-center" onClick={() => onOpenStop(nextStop.id)}>
                  Stop details
                </Button>
              </div>
              <div className="mt-3"><RouteStopActions stop={nextStop} routeId={route.id} compact /></div>
            </>
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {route.status === "in_progress" ? (
            <Button className="flex-1" size="sm" variant="outline" onClick={() => runAction(() => pauseRouteAction(route.id), "Route paused.")}>
              <Pause className="size-4" />
              Pause
            </Button>
          ) : route.status !== "completed" ? (
            <Button className="flex-1" size="sm" onClick={() => runAction(() => startRouteAction(route.id), "Route started.")}>
              <Play className="size-4" />
              Start
            </Button>
          ) : null}
          {route.status !== "completed" ? (
            <Button className="flex-1" size="sm" variant="outline" onClick={() => runAction(() => completeRouteAction(route.id), "Route completed.")}>
              <StopCircle className="size-4" />
              Complete
            </Button>
          ) : null}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="px-2.5">
                <MoreHorizontal className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent
              aria-describedby={undefined}
              className="inset-x-0 bottom-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-xl rounded-b-none border-x-0 border-b-0 p-0"
            >
              <div className="px-4 pb-5 pt-4">
                <div className="mb-4 space-y-1">
                  <DialogTitle className="text-base tracking-[-0.02em]">Route actions</DialogTitle>
                  <DialogDescription className="text-[12px] leading-5">
                    Secondary actions for the current route session.
                  </DialogDescription>
                </div>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-between" onClick={() => runAction(() => regenerateRouteAction(route.id), "Route regenerated.")}>
                    <span>Regenerate route</span>
                    <RefreshCw className="size-4" />
                  </Button>
                  {googleMapsUrl ? (
                    <Button asChild variant="outline" className="justify-between">
                      <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                        <span>Open in Google Maps</span>
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                  {route.status !== "archived" ? (
                    <Button variant="ghost" className="justify-between" onClick={() => runAction(() => archiveRouteAction(route.id), "Route archived.")}>
                      <span>Archive</span>
                      <Archive className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="hidden border border-[#e6e8ec] bg-white p-5 md:block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Route session</p>
            <h3 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-neutral-950">{route.name}</h3>
          </div>
          <RouteStatusBadge status={route.status} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="border border-[#eceff3] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Progress</p>
            <p className="mt-2 text-lg font-semibold text-neutral-950">{completedCount} / {stops.length}</p>
            <p className="mt-1 text-neutral-500">{remainingCount} stops remaining</p>
          </div>
          <div className="border border-[#eceff3] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Drive summary</p>
            <p className="mt-2 text-lg font-semibold text-neutral-950">{formatDurationMinutes(route.estimated_duration_minutes)}</p>
            <p className="mt-1 text-neutral-500">{formatDistanceMeters(route.estimated_distance_meters)}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2 text-sm text-neutral-600">
          <p><span className="font-medium text-neutral-950">Created by:</span> {route.creator?.full_name ?? route.creator?.email ?? "Unknown"}</p>
          <p><span className="font-medium text-neutral-950">Created:</span> {formatDateTime(route.created_at)}</p>
          <p><span className="font-medium text-neutral-950">Source:</span> {startCase(route.source_type ?? "auto_pick")}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {route.status !== "in_progress" && route.status !== "completed" ? (
            <Button onClick={() => runAction(() => startRouteAction(route.id), "Route started.")}>
              <Play className="size-4" />
              Start route
            </Button>
          ) : null}
          {route.status === "in_progress" ? (
            <Button variant="outline" onClick={() => runAction(() => pauseRouteAction(route.id), "Route paused.")}>
              <Pause className="size-4" />
              Pause route
            </Button>
          ) : null}
          {route.status !== "completed" ? (
            <Button variant="outline" onClick={() => runAction(() => completeRouteAction(route.id), "Route completed.")}>
              <StopCircle className="size-4" />
              Complete route
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => runAction(() => regenerateRouteAction(route.id), "Route regenerated.")}>
            <RefreshCw className="size-4" />
            Regenerate route
          </Button>
          {googleMapsUrl ? (
            <Button asChild variant="outline">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open in Google Maps
              </a>
            </Button>
          ) : (
            <Button variant="outline" disabled title={googleMapsWarning ?? ""}>
              <ExternalLink className="size-4" />
              Open in Google Maps
            </Button>
          )}
          {route.status !== "archived" ? (
            <Button variant="ghost" onClick={() => runAction(() => archiveRouteAction(route.id), "Route archived.")}>
              <Archive className="size-4" />
              Archive
            </Button>
          ) : null}
        </div>
        {googleMapsWarning ? (
          <p className="mt-3 text-xs text-neutral-400">{googleMapsWarning}</p>
        ) : null}
      </div>

      <div className="hidden border border-[#e6e8ec] bg-white p-5 md:block">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Next stop</p>
        {nextStop ? (
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">{nextStop.restaurant_name}</p>
              <p className="mt-1 text-sm text-neutral-500">{nextStop.formatted_address ?? "Address not set"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => onOpenStop(nextStop.id)}>
                Open stop details
              </Button>
              {nextStop.lead ? (
                <Button asChild variant="ghost">
                  <Link href={`/leads/${nextStop.lead.id}` as Route}>Open lead</Link>
                </Button>
              ) : null}
            </div>
            <RouteStopActions stop={nextStop} routeId={route.id} compact />
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">All stops have been resolved for this route.</p>
        )}
      </div>
    </div>
  );
}
