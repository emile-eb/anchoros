"use client";

import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import {
  useCallback,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_SORT_OPTIONS,
  LEAD_STAGE_OPTIONS,
  WEBSITE_STATUS_OPTIONS,
} from "@/lib/constants";
import type { LeadListFilters } from "@/lib/data/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ImportGoogleMapsDialog } from "@/components/leads/import-google-maps-dialog";
import { LeadUpsertDialog } from "@/components/leads/lead-upsert-dialog";
import { CreateRouteDialog } from "@/components/routes/create-route-dialog";

const LEAD_SORT_LABELS: Record<(typeof LEAD_SORT_OPTIONS)[number], string> = {
  newest: "Newest",
  oldest: "Oldest",
  recently_updated: "Recently updated",
  price_high_to_low: "Estimated price high to low",
  most_reviews: "Most reviews",
  restaurant_price_high_to_low: "Restaurant price high to low",
  restaurant_price_low_to_high: "Restaurant price low to high",
  next_follow_up: "Next follow-up",
};

const MOBILE_QUICK_VIEWS = [
  { key: "all", label: "All" },
  { key: "no_website", label: "No website", websiteStatus: "no_website" as const },
  { key: "follow_up", label: "Need follow-up", leadStage: "follow_up" as const },
  { key: "new", label: "New", leadStage: "new" as const },
  { key: "high", label: "High priority", priority: "high" as const },
] as const;

export function LeadsToolbar({
  filters,
  boroughOptions,
  selectedLeadIds = [],
}: {
  filters: LeadListFilters;
  boroughOptions: string[];
  selectedLeadIds?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.q ?? "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const activeFilterCount = useMemo(
    () =>
      [filters.leadStage, filters.websiteStatus, filters.priority, filters.leadSource, filters.borough].filter(Boolean)
        .length,
    [filters],
  );

  const updateSearch = useCallback((key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}` as Route);
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const next = deferredQuery.trim();
    const current = searchParams.get("q") ?? "";

    if (next === current) {
      return;
    }

    updateSearch("q", next);
  }, [deferredQuery, searchParams, updateSearch]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    ["leadStage", "websiteStatus", "priority", "leadSource", "borough"].forEach((key) =>
      params.delete(key),
    );

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}` as Route);
    });
  }, [pathname, router, searchParams]);

  const applyQuickView = useCallback(
    (view: (typeof MOBILE_QUICK_VIEWS)[number]) => {
      const params = new URLSearchParams(searchParams.toString());

      ["leadStage", "websiteStatus", "priority", "leadSource", "borough"].forEach((key) =>
        params.delete(key),
      );

      if ("leadStage" in view && view.leadStage) params.set("leadStage", view.leadStage);
      if ("websiteStatus" in view && view.websiteStatus) params.set("websiteStatus", view.websiteStatus);
      if ("priority" in view && view.priority) params.set("priority", view.priority);

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}` as Route);
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <>
      <section className="min-w-0 max-w-full space-y-2.5 overflow-x-hidden border-b border-[#eceff3] pb-3 lg:hidden">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-[1.58rem] font-semibold tracking-[-0.045em] text-neutral-950">Leads</h2>
          <p className="max-w-[16rem] text-[11px] leading-4 text-neutral-500">
            Queue for follow-up and next action.
          </p>
        </div>

        <div className="grid min-w-0 max-w-full grid-cols-1 gap-2">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="h-8.5 min-w-0 pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leads"
            />
          </div>

          <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
            <Select
              value={filters.sort ?? "recently_updated"}
              onChange={(event) => updateSearch("sort", event.target.value)}
              className="h-8 min-w-0 text-[12px]"
            >
              {LEAD_SORT_OPTIONS.map((sort) => (
                <option key={sort} value={sort}>
                  {LEAD_SORT_LABELS[sort]}
                </option>
              ))}
            </Select>

            <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#e6e9ee] bg-white px-2.5 text-[12px] font-medium text-neutral-700"
                >
                  <SlidersHorizontal className="size-3.5" />
                  {activeFilterCount > 0 ? `${activeFilterCount}` : "Filters"}
                </button>
              </DialogTrigger>
              <DialogContent
                aria-describedby={undefined}
                className="inset-x-0 bottom-0 left-0 right-0 top-auto max-h-[85vh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-xl rounded-b-none border-x-0 border-b-0 p-0"
              >
                <div className="px-4 pb-5 pt-4">
                  <div className="mb-4 space-y-1">
                    <DialogTitle className="text-base tracking-[-0.02em]">Filter leads</DialogTitle>
                    <DialogDescription className="text-[12px] leading-5">
                      Narrow the mobile queue without keeping every filter open.
                    </DialogDescription>
                  </div>
                  <div className="grid gap-2.5">
                    <Select
                      value={filters.leadStage ?? ""}
                      onChange={(event) => updateSearch("leadStage", event.target.value)}
                    >
                      <option value="">All stages</option>
                      {LEAD_STAGE_OPTIONS.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={filters.websiteStatus ?? ""}
                      onChange={(event) => updateSearch("websiteStatus", event.target.value)}
                    >
                      <option value="">All website statuses</option>
                      {WEBSITE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={filters.priority ?? ""}
                      onChange={(event) => updateSearch("priority", event.target.value)}
                    >
                      <option value="">All priorities</option>
                      {LEAD_PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={filters.leadSource ?? ""}
                      onChange={(event) => updateSearch("leadSource", event.target.value)}
                    >
                      <option value="">All sources</option>
                      {LEAD_SOURCE_OPTIONS.map((source) => (
                        <option key={source} value={source}>
                          {source.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={filters.borough ?? ""}
                      onChange={(event) => updateSearch("borough", event.target.value)}
                    >
                      <option value="">All boroughs</option>
                      {boroughOptions.map((borough) => (
                        <option key={borough} value={borough}>
                          {borough}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button variant="ghost" onClick={clearFilters} className="text-neutral-600">
                      Clear filters
                    </Button>
                    <Button onClick={() => setMobileFiltersOpen(false)}>Done</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#e6e9ee] bg-white px-2.5 text-[12px] font-medium text-neutral-700"
                >
                  <Plus className="size-3.5" />
                  Add
                </button>
              </DialogTrigger>
              <DialogContent
                aria-describedby={undefined}
                className="inset-x-0 bottom-0 left-0 right-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-xl rounded-b-none border-x-0 border-b-0 p-0"
              >
                <div className="px-4 pb-5 pt-4">
                  <div className="mb-4 space-y-1">
                    <DialogTitle className="text-base tracking-[-0.02em]">Add a lead</DialogTitle>
                    <DialogDescription className="text-[12px] leading-5">
                      Create or import without leaving the queue.
                    </DialogDescription>
                  </div>
                  <div className="grid gap-2">
                    <ImportGoogleMapsDialog
                      trigger={
                        <Button className="w-full justify-between" onClick={() => setMobileActionsOpen(false)}>
                          Import from Google Maps
                        </Button>
                      }
                    />
                    <LeadUpsertDialog
                      mode="create"
                      trigger={
                        <Button
                          variant="outline"
                          className="w-full justify-between text-neutral-700"
                          onClick={() => setMobileActionsOpen(false)}
                        >
                          Add manually
                        </Button>
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full items-center gap-1.5 pb-0.5">
            {MOBILE_QUICK_VIEWS.map((view) => {
              const active =
                view.key === "all"
                  ? activeFilterCount === 0
                  : ("leadStage" in view ? filters.leadStage === view.leadStage : true) &&
                    ("websiteStatus" in view ? filters.websiteStatus === view.websiteStatus : true) &&
                    ("priority" in view ? filters.priority === view.priority : true) &&
                    activeFilterCount > 0;

              return (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => applyQuickView(view)}
                  className={
                    active
                      ? "inline-flex h-7.5 shrink-0 items-center rounded-md border border-neutral-900 bg-neutral-950 px-2.5 text-[11px] font-medium text-white"
                      : "inline-flex h-7.5 shrink-0 items-center rounded-md border border-[#e6e9ee] bg-white px-2.5 text-[11px] font-medium text-neutral-600"
                  }
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3 border-b border-[#eceff3] pb-4 hidden lg:block">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 className="text-[2rem] font-semibold tracking-[-0.045em] text-neutral-950">Leads</h2>
            <p className="max-w-2xl text-sm leading-6 text-neutral-500">
              Search, qualify, and follow every restaurant from first touch through closed outcome.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLeadIds.length > 0 ? (
              <CreateRouteDialog
                selectedLeadIds={selectedLeadIds}
                trigger={
                  <Button variant="outline" size="lg">
                    Create route
                  </Button>
                }
              />
            ) : null}
            <ImportGoogleMapsDialog
              trigger={
                <Button size="lg">
                  Import from Google Maps
                </Button>
              }
            />
            <LeadUpsertDialog
              mode="create"
              trigger={
                <Button variant="ghost" size="lg" className="text-neutral-600">
                  Add manually
                </Button>
              }
            />
          </div>
        </div>
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurant, contact, email, phone, or neighborhood"
            />
          </div>
          <Select
            value={filters.sort ?? "recently_updated"}
            onChange={(event) => updateSearch("sort", event.target.value)}
          >
            {LEAD_SORT_OPTIONS.map((sort) => (
              <option key={sort} value={sort}>
                {LEAD_SORT_LABELS[sort]}
              </option>
            ))}
          </Select>
          <div
            className={
              activeFilterCount > 0
                ? "flex items-center justify-between rounded-[6px] border border-[#dfe3e8] bg-[#f8fafc] px-3 text-sm text-neutral-600"
                : "flex items-center gap-2 rounded-[6px] border border-transparent px-3 text-sm text-neutral-400"
            }
          >
            <div className="flex items-center gap-2 truncate">
              <SlidersHorizontal className="size-4 shrink-0" />
              <span className="truncate">
                {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "Filters"}
              </span>
            </div>
            {activeFilterCount > 0 ? (
              <button
                className="rounded-[5px] p-1 text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                onClick={clearFilters}
                type="button"
              >
                <X className="size-4" />
                <span className="sr-only">Clear filters</span>
              </button>
            ) : null}
          </div>
          <div className="hidden lg:block" />
        </div>
        <div className="grid gap-2 border-t border-[#f1f3f6] pt-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            value={filters.leadStage ?? ""}
            onChange={(event) => updateSearch("leadStage", event.target.value)}
          >
            <option value="">All stages</option>
            {LEAD_STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            value={filters.websiteStatus ?? ""}
            onChange={(event) => updateSearch("websiteStatus", event.target.value)}
          >
            <option value="">All website statuses</option>
            {WEBSITE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            value={filters.priority ?? ""}
            onChange={(event) => updateSearch("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            {LEAD_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
          <Select
            value={filters.leadSource ?? ""}
            onChange={(event) => updateSearch("leadSource", event.target.value)}
          >
            <option value="">All sources</option>
            {LEAD_SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>
                {source.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            value={filters.borough ?? ""}
            onChange={(event) => updateSearch("borough", event.target.value)}
          >
            <option value="">All boroughs</option>
            {boroughOptions.map((borough) => (
              <option key={borough} value={borough}>
                {borough}
              </option>
            ))}
          </Select>
        </div>
      </section>
    </>
  );
}
