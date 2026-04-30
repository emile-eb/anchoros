"use client";

import Link from "next/link";
import type { Route } from "next";
import { Map, Route as RouteIcon, Signpost, Timer } from "lucide-react";
import { CreateRouteDialog } from "@/components/routes/create-route-dialog";
import { RouteListActions } from "@/components/routes/route-list-actions";
import { RouteStatusBadge } from "@/components/routes/route-status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { PageIntro } from "@/components/app/page-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDistanceMeters, formatDurationMinutes } from "@/lib/formatters";
import type { RouteListItem } from "@/lib/data/routes";

function buildSelectionSummary(leadIds: string[], discoveryIds: string[]) {
  if (leadIds.length === 0 && discoveryIds.length === 0) {
    return "Start with a minimal route brief and let the OS auto-pick the best nearby prospects for one driver.";
  }

  const parts = [];
  if (leadIds.length > 0) {
    parts.push(`${leadIds.length} CRM lead${leadIds.length === 1 ? "" : "s"}`);
  }
  if (discoveryIds.length > 0) {
    parts.push(`${discoveryIds.length} Discovery prospect${discoveryIds.length === 1 ? "" : "s"}`);
  }

  return `Route creation is primed with ${parts.join(" and ")} from the current workspace.`;
}

function RouteWorkspaceMetric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 border-l border-[#eceff3] pl-4 first:border-l-0 first:pl-0">
      <div className="flex items-center gap-2 text-neutral-400">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="text-[1.45rem] font-semibold tracking-[-0.04em] text-neutral-950">{value}</p>
      <p className="max-w-[16rem] text-sm leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}

function FeaturedRouteMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="grid gap-1.5 border-l border-[#eceff3] pl-4 first:border-l-0 first:pl-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      <p className="text-lg font-semibold tracking-[-0.03em] text-neutral-950">{value}</p>
      <p className="text-sm leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}

export function RoutesWorkspace({
  workspaceName,
  routes,
  selectedLeadIds,
  selectedDiscoveryResultIds,
  defaultCreateOpen,
}: {
  workspaceName: string;
  routes: RouteListItem[];
  selectedLeadIds: string[];
  selectedDiscoveryResultIds: string[];
  defaultCreateOpen: boolean;
}) {
  const activeRoutes = routes.filter((route) => ["draft", "ready", "in_progress"].includes(route.status));
  const completedRoutes = routes.filter((route) => route.status === "completed");
  const featuredRoute = routes[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="md:hidden space-y-4">
        <section className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            {workspaceName}
          </p>
          <h1 className="text-[1.62rem] font-semibold tracking-[-0.045em] text-neutral-950">
            Routes
          </h1>
          <p className="max-w-[18rem] text-[12px] leading-4 text-neutral-500">
            Build a field plan fast and reopen the next route without friction.
          </p>
        </section>

        <section className="space-y-2 rounded-md border border-[#e6e8ec] bg-white px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Plan route</p>
              <p className="mt-1 text-sm font-medium text-neutral-950">Create a smart field route</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500">
              <span>{routes.length} saved</span>
              <span>·</span>
              <span>{activeRoutes.length} active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreateRouteDialog
              defaultOpen={defaultCreateOpen}
              selectedLeadIds={selectedLeadIds}
              selectedDiscoveryResultIds={selectedDiscoveryResultIds}
              trigger={
                <Button className="flex-1 text-white [&_span]:text-white" style={{ color: "#ffffff" }}>
                  <span className="text-white" style={{ color: "#ffffff" }}>Create route</span>
                </Button>
              }
            />
            {(selectedLeadIds.length > 0 || selectedDiscoveryResultIds.length > 0) ? (
              <Button asChild variant="outline">
                <Link href="/routes">Clear</Link>
              </Button>
            ) : null}
          </div>
        </section>

        {featuredRoute ? (
          <section className="space-y-2 rounded-md border border-[#e6e8ec] bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Latest route</p>
                <h2 className="mt-1 truncate text-[15px] font-semibold tracking-[-0.03em] text-neutral-950">
                  {featuredRoute.name}
                </h2>
              </div>
              <RouteStatusBadge status={featuredRoute.status} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>{featuredRoute.total_stops} stops</span>
              <span>{formatDurationMinutes(featuredRoute.estimated_duration_minutes)}</span>
              <span>{formatDistanceMeters(featuredRoute.estimated_distance_meters)}</span>
            </div>
            <RouteListActions route={featuredRoute} />
          </section>
        ) : (
          <EmptyState
            icon={<Map className="size-5" />}
            title="No field routes yet"
            description="Create the first route and start working stops in order."
          />
        )}

        {routes.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-neutral-950">Saved routes</h3>
              <p className="text-[11px] text-neutral-500">{completedRoutes.length} completed</p>
            </div>
            <div className="grid gap-2">
              {routes.map((route) => (
                <Card key={route.id} className="border-[#e6e8ec] bg-white">
                  <CardContent className="space-y-2 px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/routes/${route.id}` as Route}
                          className="block truncate text-[15px] font-semibold tracking-[-0.03em] text-neutral-950"
                        >
                          {route.name}
                        </Link>
                      </div>
                      <RouteStatusBadge status={route.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{route.total_stops} stops</span>
                      <span>{formatDurationMinutes(route.estimated_duration_minutes)}</span>
                      <span>{formatDistanceMeters(route.estimated_distance_meters)}</span>
                    </div>
                    <RouteListActions route={route} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="hidden md:block space-y-8">
        <PageIntro
          eyebrow={workspaceName}
          title="Routes"
          description="Group restaurant prospects into a practical driving plan, optimize the stop order, and work each route in the field without manual planning."
        />

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-[#e6e8ec] bg-white">
          <CardContent className="flex h-full flex-col gap-6 px-6 py-6">
            <div className="space-y-2 border-b border-[#eceff3] pb-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Route planning</p>
              <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-neutral-950">Create a smart field route</h3>
              <p className="max-w-2xl text-sm leading-6 text-neutral-500">
                {buildSelectionSummary(selectedLeadIds, selectedDiscoveryResultIds)}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <RouteWorkspaceMetric
                label="Saved routes"
                value={routes.length.toString()}
                detail="All route plans in this workspace"
                icon={<RouteIcon className="size-4" />}
              />
              <RouteWorkspaceMetric
                label="Active"
                value={activeRoutes.length.toString()}
                detail="Routes still being worked"
                icon={<Timer className="size-4" />}
              />
              <RouteWorkspaceMetric
                label="Completed"
                value={completedRoutes.length.toString()}
                detail="Finished field runs"
                icon={<Signpost className="size-4" />}
              />
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-[#eceff3] pt-4">
              <CreateRouteDialog
                defaultOpen={defaultCreateOpen}
                selectedLeadIds={selectedLeadIds}
                selectedDiscoveryResultIds={selectedDiscoveryResultIds}
              />
              {(selectedLeadIds.length > 0 || selectedDiscoveryResultIds.length > 0) ? (
                <Button asChild size="lg" variant="outline">
                  <Link href="/routes">
                    Clear selection
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {featuredRoute ? (
          <Card className="overflow-hidden border-[#e6e8ec] bg-white">
            <CardContent className="flex h-full flex-col gap-6 px-6 py-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#eceff3] pb-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Latest route</p>
                  <h3 className="mt-2 truncate text-[1.4rem] font-semibold tracking-[-0.035em] text-neutral-950">{featuredRoute.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    Created {formatDate(featuredRoute.created_at)} by {featuredRoute.creator?.full_name ?? featuredRoute.creator?.email ?? "Unknown"}
                  </p>
                </div>
                <RouteStatusBadge status={featuredRoute.status} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FeaturedRouteMetric
                  label="Drive summary"
                  value={formatDurationMinutes(featuredRoute.estimated_duration_minutes)}
                  detail={formatDistanceMeters(featuredRoute.estimated_distance_meters)}
                />
                <FeaturedRouteMetric
                  label="Stops"
                  value={featuredRoute.total_stops.toString()}
                  detail={`${featuredRoute.origin_label} to ${featuredRoute.destination_label}`}
                />
              </div>
              <div className="mt-auto border-t border-[#eceff3] pt-4">
                <RouteListActions route={featuredRoute} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={<Map className="size-5" />}
            title="No field routes yet"
            description="Create a route from leads, discovery prospects, or let the OS auto-pick no-website stops near a starting point."
          />
        )}
        </section>

        {routes.length === 0 ? null : (
          <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-950">Saved routes</h3>
            <p className="text-sm text-neutral-500">
              Open a route to work through stops in order, update outcomes, and keep field activity tied back to the CRM.
            </p>
          </div>
          <div className="grid gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="overflow-hidden border-[#e6e8ec] bg-white transition-colors hover:bg-[#fcfcfd]">
                <CardContent className="space-y-5 px-6 py-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/routes/${route.id}` as Route}
                          className="text-xl font-semibold tracking-tight text-neutral-950 transition-colors hover:text-neutral-700"
                        >
                          {route.name}
                        </Link>
                        <RouteStatusBadge status={route.status} />
                      </div>
                      <p className="text-sm text-neutral-500">
                        Created {formatDate(route.created_at)} by {route.creator?.full_name ?? route.creator?.email ?? "Unknown"}
                      </p>
                    </div>
                    <RouteListActions route={route} />
                  </div>

                  <div className="grid gap-3 text-sm text-neutral-600 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="border border-[#eceff3] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Stops</p>
                      <p className="mt-2 font-semibold text-neutral-950">{route.total_stops}</p>
                      <p className="mt-1 text-neutral-500">Optimized stop count</p>
                    </div>
                    <div className="border border-[#eceff3] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Drive time</p>
                      <p className="mt-2 font-semibold text-neutral-950">{formatDurationMinutes(route.estimated_duration_minutes)}</p>
                      <p className="mt-1 text-neutral-500">Estimated one-driver route</p>
                    </div>
                    <div className="border border-[#eceff3] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Distance</p>
                      <p className="mt-2 font-semibold text-neutral-950">{formatDistanceMeters(route.estimated_distance_meters)}</p>
                      <p className="mt-1 text-neutral-500">Round-trip drive estimate</p>
                    </div>
                    <div className="border border-[#eceff3] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Route window</p>
                      <p className="mt-2 font-semibold text-neutral-950">{route.origin_label}</p>
                      <p className="mt-1 truncate text-neutral-500">{route.destination_label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </section>
        )}
      </div>
    </div>
  );
}
