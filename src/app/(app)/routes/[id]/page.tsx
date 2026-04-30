import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageIntro } from "@/components/app/page-intro";
import { RouteDetailWorkspace } from "@/components/routes/route-detail-workspace";
import { RouteStatusBadge } from "@/components/routes/route-status-badge";
import { Button } from "@/components/ui/button";
import { getRouteDetailPageData } from "@/lib/data/routes";
import { formatDateTime } from "@/lib/formatters";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { route, stops, mapData } = await getRouteDetailPageData(id);

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/routes">
            <ArrowLeft className="size-4" />
            Back to routes
          </Link>
        </Button>
      </div>

      <section className="space-y-2 md:hidden">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
            {route.creator?.full_name ?? route.creator?.email ?? "Anchor Studios"}
          </p>
          <h1 className="text-[1.45rem] font-semibold tracking-[-0.045em] text-neutral-950">{route.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RouteStatusBadge status={route.status} />
          <p className="text-[11px] text-neutral-500">Created {formatDateTime(route.created_at)}</p>
        </div>
      </section>

      <section className="hidden space-y-5 md:block">
        <PageIntro
          eyebrow={route.creator?.full_name ?? route.creator?.email ?? "Anchor Studios"}
          title={route.name}
          description="Run the full field session inside Anchor Studios OS with a synced route map, next-stop workflow, and fast stop updates."
        />
        <div className="flex flex-wrap items-center gap-3">
          <RouteStatusBadge status={route.status} />
          <p className="text-sm text-neutral-500">Created {formatDateTime(route.created_at)}</p>
        </div>
      </section>

      <RouteDetailWorkspace route={route} stops={stops} mapData={mapData} />
    </div>
  );
}
