"use client";

import { useMemo, useState } from "react";
import type { RouteDetail, RouteMapData, RouteStopDetail } from "@/lib/data/routes";
import { RouteMap } from "@/components/routes/route-map";
import { RouteProgressPanel } from "@/components/routes/route-progress-panel";
import { RouteStopList } from "@/components/routes/route-stop-list";
import { RouteStopSheet } from "@/components/routes/route-stop-sheet";
import { Button } from "@/components/ui/button";

export function RouteDetailWorkspace({
  route,
  stops,
  mapData,
}: {
  route: RouteDetail;
  stops: RouteStopDetail[];
  mapData: RouteMapData | null;
}) {
  const nextStop = useMemo(
    () => stops.find((stop) => stop.status === "active") ?? stops.find((stop) => stop.status === "pending") ?? null,
    [stops],
  );
  const [selectedStopId, setSelectedStopId] = useState<string | null>(nextStop?.id ?? stops[0]?.id ?? null);
  const [sheetStopId, setSheetStopId] = useState<string | null>(null);
  const selectedStop = stops.find((stop) => stop.id === selectedStopId) ?? null;
  const sheetStop = stops.find((stop) => stop.id === sheetStopId) ?? null;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="order-2 border border-[#e6e8ec] bg-white p-1.5 md:order-1 md:p-2">
          <RouteMap
            mapData={mapData}
            stops={stops}
            selectedStopId={selectedStopId}
            onSelectStop={(stopId) => setSelectedStopId(stopId)}
          />
        </div>
        <div className="order-1 md:order-2">
          <RouteProgressPanel
          route={route}
          stops={stops}
          googleMapsUrl={mapData?.googleMapsUrl ?? null}
          googleMapsWarning={mapData?.googleMapsWarning ?? null}
          nextStop={nextStop}
          onOpenStop={(stopId) => {
            setSelectedStopId(stopId);
              setSheetStopId(stopId);
            }}
          />
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-950 md:text-xl">Stop queue</h3>
            <p className="mt-1 text-[12px] leading-4 text-neutral-500 md:text-sm md:leading-6">
              Tap any stop to focus it on the map and open its route workflow.
            </p>
          </div>
          {selectedStop ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSheetStopId(selectedStop.id)}
            >
              Open selected stop
            </Button>
          ) : null}
        </div>
        <RouteStopList
          stops={stops}
          selectedStopId={selectedStopId}
          onSelectStop={(stopId) => setSelectedStopId(stopId)}
          onOpenStop={(stopId) => setSheetStopId(stopId)}
        />
      </section>

      {nextStop ? (
        <div className="fixed inset-x-3 bottom-3 z-40 rounded-md border border-[#dfe3e8] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] md:hidden">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Next stop</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-neutral-950">{nextStop.restaurant_name}</p>
              <p className="truncate text-[12px] text-neutral-500">{nextStop.formatted_address ?? "Address not set"}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedStopId(nextStop.id);
                setSheetStopId(nextStop.id);
              }}
            >
              Open
            </Button>
          </div>
        </div>
      ) : null}

      <RouteStopSheet
        stop={sheetStop}
        routeId={route.id}
        open={Boolean(sheetStop)}
        onOpenChange={(open) => {
          if (!open) {
            setSheetStopId(null);
          }
        }}
      />
    </div>
  );
}
