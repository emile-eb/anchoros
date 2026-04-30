"use client";

import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DISCOVERY_BUSINESS_TYPE_OPTIONS,
  DISCOVERY_MIN_REVIEW_OPTIONS,
  DISCOVERY_RESULT_LIMIT_OPTIONS,
  DISCOVERY_SUBTYPE_MODE_OPTIONS,
  DISCOVERY_SUGGESTED_SEARCHES,
} from "@/lib/constants";
import type {
  DiscoveryRegionData,
  DiscoveryRegionType,
  DiscoverySearchMode,
  DiscoverySubtypeMode,
} from "@/lib/discovery/types";
import type { DiscoveryJobRequestInput } from "@/lib/validators/discovery";
import type { DiscoveryResultItem } from "@/lib/data/discovery-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DiscoveryRegionMap } from "@/components/discovery/discovery-region-map";

type PreviewResponse = {
  label: string;
  regionType: DiscoveryRegionType;
  regionData: DiscoveryRegionData;
};

type DiscoveryToolbarDefaults = {
  searchMode: DiscoverySearchMode;
  query?: string;
  businessType: DiscoveryJobRequestInput["businessType"];
  subtype?: string;
  subtypeMode: DiscoverySubtypeMode;
  minimumReviews: DiscoveryJobRequestInput["minimumReviews"];
  limit: DiscoveryJobRequestInput["limit"];
  noWebsiteOnly: true;
  regionType: DiscoveryRegionType;
  regionData: DiscoveryRegionData | null;
};

export function DiscoveryToolbar({
  defaultValues,
  isStarting,
  searchEnabled,
  mapEnabled,
  results,
  focusedResultId,
  hoveredResultId,
  onSelectResult,
  onSubmit,
}: {
  defaultValues: DiscoveryToolbarDefaults;
  isStarting: boolean;
  searchEnabled: boolean;
  mapEnabled: boolean;
  results: DiscoveryResultItem[];
  focusedResultId: string | null;
  hoveredResultId: string | null;
  onSelectResult: (resultId: string | null) => void;
  onSubmit: (values: DiscoveryJobRequestInput) => void;
}) {
  const [searchMode, setSearchMode] = useState<DiscoverySearchMode>(defaultValues.searchMode);
  const [query, setQuery] = useState(defaultValues.query ?? "");
  const [businessType, setBusinessType] = useState(defaultValues.businessType);
  const [subtype, setSubtype] = useState(defaultValues.subtype ?? "");
  const [subtypeMode, setSubtypeMode] = useState<DiscoverySubtypeMode>(defaultValues.subtypeMode);
  const [minimumReviews, setMinimumReviews] = useState(String(defaultValues.minimumReviews));
  const [limit, setLimit] = useState(String(defaultValues.limit));
  const [regionType, setRegionType] = useState<DiscoveryRegionType>(defaultValues.regionType);
  const [regionData, setRegionData] = useState<DiscoveryRegionData | null>(defaultValues.regionData);
  const [circleRadiusMeters, setCircleRadiusMeters] = useState(
    defaultValues.regionData?.type === "circle" ? String(Math.round(defaultValues.regionData.radiusMeters)) : "1200",
  );
  const [isRectangleDrawing, setIsRectangleDrawing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const previewQuickArea = async (nextQuery?: string, nextBusinessType?: string) => {
    const previewQuery = (nextQuery ?? query).trim();
    if (previewQuery.length < 2) {
      toast.error("Enter an area, neighborhood, or address to preview.");
      return;
    }

    setIsPreviewing(true);

    const response = await fetch("/api/discovery/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: previewQuery }),
    });

    setIsPreviewing(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      toast.error(payload.error ?? "Could not preview that area.");
      return;
    }

    const payload = (await response.json()) as PreviewResponse;
    setQuery(previewQuery);
    setRegionType(payload.regionType);
    setRegionData(payload.regionData);
    setBusinessType((nextBusinessType as typeof businessType | undefined) ?? businessType);
    setIsRectangleDrawing(false);
  };

  return (
    <section className="space-y-4 border border-[#e6e8ec] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-[#eceff3] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">Anchor Studios</p>
          <div className="space-y-1">
            <h2 className="text-[2.05rem] font-semibold tracking-[-0.045em] text-neutral-950">
              Exact no-website prospect sweeps
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-neutral-500 sm:text-base">
              Draw the exact region, sweep only that area, and keep final prospects pinned directly on the map.
            </p>
          </div>
        </div>
        <div className="border-l border-[#eceff3] pl-4 text-sm leading-6 text-neutral-500 lg:max-w-sm">
          Rectangle drawing is the primary workflow. Quick area stays available when you want a faster geocoded preview before sweeping.
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="searchMode">Search mode</Label>
          <Select
            id="searchMode"
            value={searchMode}
            onChange={(event) => {
              const nextMode = event.target.value as DiscoverySearchMode;
              setSearchMode(nextMode);
              if (nextMode === "exact_region") {
                setRegionType((current) => (current === "geocoded_area" ? "rectangle" : current));
              }
            }}
          >
            <option value="exact_region">Exact region</option>
            <option value="quick_area">Quick area</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Business type</Label>
          <Select
            id="businessType"
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value as DiscoveryJobRequestInput["businessType"])}
          >
            {DISCOVERY_BUSINESS_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtype">Subtype</Label>
          <Input
            id="subtype"
            value={subtype}
            onChange={(event) => setSubtype(event.target.value)}
            placeholder="Pizza, halal, ramen"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtypeMode">Subtype mode</Label>
          <Select
            id="subtypeMode"
            value={subtypeMode}
            onChange={(event) => setSubtypeMode(event.target.value as DiscoverySubtypeMode)}
          >
            {DISCOVERY_SUBTYPE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumReviews">Minimum reviews</Label>
          <Select id="minimumReviews" value={minimumReviews} onChange={(event) => setMinimumReviews(event.target.value)}>
            {DISCOVERY_MIN_REVIEW_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit">Final prospects</Label>
          <Select id="limit" value={limit} onChange={(event) => setLimit(event.target.value)}>
            {DISCOVERY_RESULT_LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {searchMode === "quick_area" ? (
        <div className="grid gap-3 border border-[#eceff3] bg-[#fbfcfd] p-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="discovery-query">Area or neighborhood</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="discovery-query"
                className="pl-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Brooklyn, Williamsburg Brooklyn, or Park Slope Brooklyn"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full lg:w-auto"
              onClick={() => void previewQuickArea()}
              disabled={!searchEnabled || isPreviewing}
            >
              <Search className="size-4" />
              {isPreviewing ? "Previewing..." : "Preview area"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border border-[#eceff3] bg-[#fbfcfd] px-4 py-3">
          <Button
            type="button"
            size="sm"
            variant={isRectangleDrawing || regionType === "rectangle" ? "default" : "outline"}
            onClick={() => {
              setRegionType("rectangle");
              setIsRectangleDrawing(true);
              onSelectResult(null);
            }}
          >
            Draw rectangle
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={300}
              step={100}
              className="w-28"
              value={circleRadiusMeters}
              onChange={(event) => setCircleRadiusMeters(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant={regionType === "circle" ? "default" : "outline"}
              onClick={() => {
                setRegionType("circle");
                setIsRectangleDrawing(false);
              }}
            >
              Center + radius
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setRegionData(null);
              setIsRectangleDrawing(false);
              onSelectResult(null);
            }}
          >
            Clear region
          </Button>
          <p className="text-sm text-neutral-500">
            Rectangle mode is the exact search area. Only places inside that box are swept.
          </p>
        </div>
      )}

      <DiscoveryRegionMap
        mapEnabled={mapEnabled}
        regionData={regionData}
        isRectangleDrawing={searchMode === "exact_region" && regionType === "rectangle" && isRectangleDrawing}
        circleRadiusMeters={Number(circleRadiusMeters) || 1200}
        results={results}
        focusedResultId={focusedResultId}
        hoveredResultId={hoveredResultId}
        onRegionChange={(region) => {
          setRegionData(region);
          if (region) {
            setRegionType(region.type);
          }
        }}
        onRectangleDrawingChange={setIsRectangleDrawing}
        onSelectResult={onSelectResult}
      />

      <div className="grid gap-3 border-t border-[#eceff3] pt-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            <Sparkles className="size-4" />
            Suggested searches
          </div>
          <div className="flex flex-wrap gap-2">
            {DISCOVERY_SUGGESTED_SEARCHES.map((chip) => (
              <button
                key={chip.label}
                className="rounded-[6px] border border-[#e5e7eb] bg-white px-2.5 py-1 text-sm text-neutral-600 transition-colors hover:bg-[#f9fafb] hover:text-neutral-950"
                type="button"
                onClick={() => {
                  setSearchMode("quick_area");
                  setQuery(chip.query);
                  setBusinessType(chip.businessType);
                  void previewQuickArea(chip.query, chip.businessType);
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-end">
          <Button
            size="lg"
            type="button"
            disabled={!searchEnabled || isStarting || !regionData}
            onClick={() => {
              if (!regionData) {
                return;
              }

              const finalRegion =
                searchMode === "exact_region" && regionType === "circle" && regionData.type === "circle"
                  ? { ...regionData, radiusMeters: Number(circleRadiusMeters) || regionData.radiusMeters }
                  : regionData;

              onSubmit({
                searchMode,
                query,
                businessType,
                subtype,
                subtypeMode,
                minimumReviews: Number(minimumReviews) as DiscoveryJobRequestInput["minimumReviews"],
                limit: Number(limit) as DiscoveryJobRequestInput["limit"],
                noWebsiteOnly: true,
                regionType: finalRegion.type,
                regionData: finalRegion,
              });
            }}
          >
            <Search className="size-4" />
            {isStarting ? "Starting sweep..." : "Start discovery sweep"}
          </Button>
        </div>
      </div>
    </section>
  );
}
