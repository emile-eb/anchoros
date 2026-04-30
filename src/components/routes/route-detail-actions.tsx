"use client";

import { Copy, ExternalLink, Play, Archive, Trash2 } from "lucide-react";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { archiveRouteAction, deleteRouteAction, duplicateRouteAction, startRouteAction } from "@/lib/actions/routes";
import type { RouteDetail } from "@/lib/data/routes";
import { Button } from "@/components/ui/button";
import type { Route } from "next";

export function RouteDetailActions({
  route,
  googleMapsUrl,
  googleMapsWarning,
}: {
  route: RouteDetail;
  googleMapsUrl: string | null;
  googleMapsWarning: string | null;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {route.status !== "in_progress" && route.status !== "completed" ? (
        <Button
          onClick={() =>
            startTransition(async () => {
              const result = await startRouteAction(route.id);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Route started.");
              router.refresh();
            })
          }
        >
          <Play className="size-4" />
          Start route
        </Button>
      ) : null}
      <Button
        variant="outline"
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateRouteAction(route.id);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              if (!result.route) {
                toast.error("Duplicated route response was incomplete.");
                return;
              }
              toast.success("Route duplicated.");
              router.push(`/routes/${result.route.id}` as Route);
            })
          }
        >
        <Copy className="size-4" />
        Duplicate
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
        <Button
          variant="ghost"
          onClick={() =>
            startTransition(async () => {
              const result = await archiveRouteAction(route.id);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Route archived.");
              router.refresh();
            })
          }
        >
          <Archive className="size-4" />
          Archive
        </Button>
      ) : null}
      <Button
        variant="ghost"
        onClick={() => {
          if (!window.confirm(`Delete "${route.name}"? This will remove the route and its stops.`)) {
            return;
          }

          startTransition(async () => {
            const result = await deleteRouteAction(route.id);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Route deleted.");
            router.push("/routes");
          });
        }}
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
    </div>
  );
}
