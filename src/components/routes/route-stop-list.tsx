"use client";

import { motion } from "framer-motion";
import { ChevronRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RouteStopStatusBadge } from "@/components/routes/route-stop-status-badge";
import type { RouteStopDetail } from "@/lib/data/routes";
import { formatDateTime, startCase } from "@/lib/formatters";

export function RouteStopList({
  stops,
  selectedStopId,
  onSelectStop,
  onOpenStop,
}: {
  stops: RouteStopDetail[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  onOpenStop: (stopId: string) => void;
}) {
  return (
    <div className="grid gap-1.5 md:gap-2">
      {stops.map((stop) => {
        const isSelected = stop.id === selectedStopId;

        return (
          <motion.button
            key={stop.id}
            type="button"
            onClick={() => {
              onSelectStop(stop.id);
              onOpenStop(stop.id);
            }}
            className="text-left"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          >
            <Card
              className={
                isSelected
                  ? "border-neutral-900 bg-white shadow-none"
                  : "border-[#e6e8ec] bg-white transition-colors hover:bg-[#fafbfc]"
              }
            >
              <CardContent className="space-y-1.5 px-3 py-2.5 md:px-4 md:py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={isSelected ? "rounded-md bg-neutral-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white" : "rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500"}>
                        Stop {stop.stop_order}
                      </div>
                      <RouteStopStatusBadge status={stop.status} />
                    </div>
                    <div>
                      <p className="text-[0.98rem] font-semibold tracking-[-0.03em] text-neutral-950 md:text-[1.05rem]">
                        {stop.restaurant_name}
                      </p>
                      <p className="mt-0.5 flex items-start gap-2 text-[12px] leading-4.5 text-neutral-500 md:text-sm md:leading-5">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-neutral-400 md:size-4" />
                        <span className="line-clamp-2">{stop.formatted_address ?? "Address not set"}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-neutral-400" />
                </div>
                {stop.lead?.lead_stage || stop.visit_outcome || stop.completed_at ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-500 md:text-sm">
                    {stop.lead?.lead_stage ? <span>Stage {startCase(stop.lead.lead_stage)}</span> : null}
                    {stop.visit_outcome ? <span>{startCase(stop.visit_outcome)}</span> : null}
                    {stop.completed_at ? <span>Updated {formatDateTime(stop.completed_at)}</span> : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}
