"use client";

import { SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/empty-state";
import { DiscoveryImportAllButton } from "@/components/discovery/discovery-import-all-button";
import { DiscoveryJobProgress } from "@/components/discovery/discovery-job-progress";
import { DiscoveryResults } from "@/components/discovery/discovery-results";
import { DiscoveryToolbar } from "@/components/discovery/discovery-toolbar";
import { CreateRouteDialog } from "@/components/routes/create-route-dialog";
import { DISCOVERY_SORT_OPTIONS, type DiscoverySortOption } from "@/lib/constants";
import type {
  DiscoveryJobRow,
  DiscoveryResultItem,
} from "@/lib/data/discovery-jobs";
import type { DiscoveryJobRequestInput } from "@/lib/validators/discovery";
import { Select } from "@/components/ui/select";

type DiscoveryJobResponse = {
  job: DiscoveryJobRow;
  results: DiscoveryResultItem[];
};

export function DiscoveryWorkspace({
  initialJobId,
  searchEnabled,
  mapEnabled,
  missingDiscoveryEnv,
}: {
  initialJobId?: string;
  searchEnabled: boolean;
  mapEnabled: boolean;
  missingDiscoveryEnv: string[];
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState(initialJobId ?? "");
  const [jobData, setJobData] = useState<DiscoveryJobResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [sort, setSort] = useState<DiscoverySortOption>("most_reviews");
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [focusedResultId, setFocusedResultId] = useState<string | null>(null);
  const [hoveredResultId, setHoveredResultId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !searchEnabled) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const response = await fetch(`/api/discovery/jobs/${jobId}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        if (!cancelled) {
          setJobData(null);
        }
        return;
      }

      const payload = (await response.json()) as DiscoveryJobResponse;

      if (!cancelled) {
        setJobData(payload);
      }
    };

    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, searchEnabled]);

  const startJob = async (values: DiscoveryJobRequestInput) => {
    setIsStarting(true);

    const response = await fetch("/api/discovery/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    setIsStarting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      toast.error(payload.error ?? "Could not start discovery search.");
      return;
    }

    const payload = (await response.json()) as { jobId: string };
    setJobId(payload.jobId);
    setJobData(null);
    setSelectedResultIds([]);
    setFocusedResultId(null);
    setHoveredResultId(null);
    router.replace(`/discovery?job=${payload.jobId}`);
  };

  const job = jobData?.job ?? null;
  const results = useMemo(() => jobData?.results ?? [], [jobData]);
  const toolbarDefaults = useMemo(
    () => ({
      searchMode: job?.search_mode ?? "exact_region",
      query: job?.raw_query ?? "",
      businessType: (job?.business_type as DiscoveryJobRequestInput["businessType"] | undefined) ?? "restaurant",
      subtype: job?.subtype ?? "",
      subtypeMode: job?.subtype_mode ?? "broad",
      minimumReviews: ((job?.minimum_reviews ?? 10) as DiscoveryJobRequestInput["minimumReviews"]),
      limit: ((job?.desired_final_results ?? 100) as DiscoveryJobRequestInput["limit"]),
      noWebsiteOnly: true as const,
      regionType: job?.region_type ?? "rectangle",
      regionData: (job?.region_data as import("@/lib/discovery/types").DiscoveryRegionData | null) ?? null,
    }),
    [job],
  );
  const sortedResults = useMemo(() => {
    const next = [...results];

    switch (sort) {
      case "alphabetical":
        return next.sort((a, b) => a.name.localeCompare(b.name));
      case "highest_rating":
        return next.sort(
          (a, b) =>
            (b.rating ?? -1) - (a.rating ?? -1) ||
            (b.review_count ?? -1) - (a.review_count ?? -1),
        );
      case "price_high_to_low":
        return next.sort(
          (a, b) =>
            (b.price_level ?? -1) - (a.price_level ?? -1) ||
            (b.review_count ?? -1) - (a.review_count ?? -1),
        );
      case "price_low_to_high":
        return next.sort(
          (a, b) =>
            (a.price_level ?? Number.MAX_SAFE_INTEGER) - (b.price_level ?? Number.MAX_SAFE_INTEGER) ||
            (b.review_count ?? -1) - (a.review_count ?? -1),
        );
      case "most_reviews":
      default:
        return next.sort(
          (a, b) =>
            (b.review_count ?? -1) - (a.review_count ?? -1) ||
            (b.rating ?? -1) - (a.rating ?? -1),
        );
    }
  }, [results, sort]);
  const importableCount = sortedResults.filter((result) => !result.existing_lead).length;
  const selectedDiscoveryIds = useMemo(
    () =>
      sortedResults
        .filter((result) => selectedResultIds.includes(result.result_id))
        .map((result) => result.result_id),
    [selectedResultIds, sortedResults],
  );

  const toggleResult = (resultId: string) => {
    setSelectedResultIds((current) =>
      current.includes(resultId)
        ? current.filter((value) => value !== resultId)
        : [...current, resultId],
    );
  };

  const toggleAllResults = () => {
    setSelectedResultIds(
      selectedDiscoveryIds.length === sortedResults.length
        ? []
        : sortedResults.map((result) => result.result_id),
    );
  };

  return (
    <div className="space-y-6">
      <DiscoveryToolbar
        key={job?.id ?? "new"}
        defaultValues={toolbarDefaults}
        isStarting={isStarting}
        searchEnabled={searchEnabled}
        mapEnabled={mapEnabled}
        results={sortedResults}
        focusedResultId={focusedResultId}
        hoveredResultId={hoveredResultId}
        onSelectResult={setFocusedResultId}
        onSubmit={startJob}
      />

      {!searchEnabled ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Discovery jobs are not configured"
          description={`Add ${missingDiscoveryEnv.join(", ")}, then restart the app. Exact-region Discovery uses persisted jobs, browser map setup, and background progress updates.`}
        />
      ) : !jobId ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Start an exact-region sweep"
          description="Define the actual region on the map, set the review threshold, and let the backend sweep only that geometry for no-website prospects."
        />
      ) : job && (job.status === "queued" || job.status === "running") ? (
        <DiscoveryJobProgress job={job} />
      ) : job && job.status === "failed" ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Discovery search failed"
          description={job.error_message ?? "The area sweep did not complete. Try again with a smaller area or a more specific query."}
        />
      ) : job && results.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No no-website restaurants found"
          description="The sweep completed, but no no-website prospects survived the final checks. Try another neighborhood, business type, or a more focused subtype."
        />
      ) : job ? (
        <>
          <div className="flex flex-col gap-3 border-b border-[#eceff3] pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                No-website prospects
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Add all imports every visible result that is not already in the CRM. Contact number and pricing stay blank.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-[180px]">
                <Select
                  aria-label="Sort discovery results"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as DiscoverySortOption)}
                >
                  {DISCOVERY_SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              {selectedDiscoveryIds.length > 0 ? (
                <CreateRouteDialog
                  selectedDiscoveryResultIds={selectedDiscoveryIds}
                  trigger={<button className="inline-flex h-9 items-center justify-center rounded-md border border-[#e5e7eb] px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-[#f9fafb]">Create route</button>}
                />
              ) : null}
              <DiscoveryImportAllButton
                discoveryJobId={job.id}
                importableCount={importableCount}
              />
            </div>
          </div>
          <section className="grid gap-0 border border-[#e6e8ec] bg-white md:grid-cols-4">
            {[
              {
                label: "Tiles scanned",
                value: job.total_tiles.toString(),
                detail: "Search regions covered",
              },
              {
                label: "Raw places",
                value: job.raw_places_found.toString(),
                detail: "Collected before dedupe",
              },
              {
                label: "Unique places",
                value: job.unique_places_found.toString(),
                detail: "Deduped across the sweep",
              },
              {
                label: "No website",
                value: job.no_website_places_found.toString(),
                detail: "Saved as final prospects",
              },
            ].map((metric, index) => (
              <div
                key={metric.label}
                className={index === 0 ? "border-b border-[#eceff3] px-4 py-3.5 md:border-b-0 md:border-r" : index === 3 ? "px-4 py-3.5" : "border-b border-[#eceff3] px-4 py-3.5 md:border-b-0 md:border-r"}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">{metric.label}</p>
                <p className="mt-1.5 text-[1.4rem] font-semibold tracking-[-0.04em] text-neutral-950">{metric.value}</p>
                <p className="mt-0.5 text-sm text-neutral-500">{metric.detail}</p>
              </div>
            ))}
          </section>
          <DiscoveryResults
            results={sortedResults}
            selectedResultIds={selectedResultIds}
            focusedResultId={focusedResultId}
            hoveredResultId={hoveredResultId}
            onToggleResult={toggleResult}
            onToggleAll={toggleAllResults}
            onFocusResult={setFocusedResultId}
            onHoverResult={setHoveredResultId}
            minimumReviews={job.minimum_reviews}
          />
        </>
      ) : null}
    </div>
  );
}
