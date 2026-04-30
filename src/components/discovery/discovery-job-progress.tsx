"use client";

import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DiscoveryJobRow } from "@/lib/data/discovery-jobs";

export function DiscoveryJobProgress({
  job,
}: {
  job: DiscoveryJobRow;
}) {
  return (
    <Card>
      <CardContent className="space-y-6 px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <LoaderCircle className="size-6 animate-spin text-neutral-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
              Discovery search in progress
            </h3>
            <p className="text-sm leading-7 text-neutral-500">
              {job.current_phase ?? "Preparing search job"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Tiles</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {job.completed_tiles} / {job.total_tiles || "?"}
            </p>
          </div>
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Raw candidates</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{job.raw_places_found}</p>
          </div>
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Unique</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{job.unique_places_found}</p>
          </div>
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Review filter</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{job.candidates_passing_review_filter}</p>
          </div>
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">No website</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{job.candidates_passing_no_website_filter}</p>
          </div>
          <div className="border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Final saved</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{job.no_website_places_found}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
