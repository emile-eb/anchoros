"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscoveryImportDialog } from "@/components/discovery/discovery-import-dialog";
import { LeadStageBadge } from "@/components/leads/lead-stage-badge";
import type { DiscoveryResultItem } from "@/lib/data/discovery-jobs";
import type { LeadStage } from "@/lib/types/database";
import { startCase } from "@/lib/formatters";

function formatPriceLevel(level: number | null) {
  if (level == null || level < 1) {
    return "Price unknown";
  }

  return "$".repeat(level);
}

function getWebsiteBadge(result: DiscoveryResultItem) {
  if (result.website_presence === "unknown") {
    return <Badge>Website unclear</Badge>;
  }

  return <Badge variant="warning">No website</Badge>;
}

function DiscoveryFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-sm text-neutral-700">{value}</p>
    </div>
  );
}

export function DiscoveryResults({
  results,
  selectedResultIds,
  focusedResultId,
  hoveredResultId,
  onToggleResult,
  onToggleAll,
  onFocusResult,
  onHoverResult,
  minimumReviews,
}: {
  results: DiscoveryResultItem[];
  selectedResultIds: string[];
  focusedResultId: string | null;
  hoveredResultId: string | null;
  onToggleResult: (resultId: string) => void;
  onToggleAll: () => void;
  onFocusResult: (resultId: string | null) => void;
  onHoverResult: (resultId: string | null) => void;
  minimumReviews: number;
}) {
  const allSelected =
    results.length > 0 && results.every((result) => selectedResultIds.includes(result.result_id));

  return (
    <section className="space-y-0 border border-[#e6e8ec] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#eceff3] px-4 py-3 text-sm text-neutral-600">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            aria-label="Select all discovery results"
            checked={allSelected}
            onChange={onToggleAll}
            className="size-4 rounded-[4px] border-[#cfd6df]"
          />
          <span className="font-medium text-neutral-700">Select all visible prospects</span>
        </label>
        <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
          {results.length} visible
        </span>
      </div>

      <div className="divide-y divide-[#eef1f4]">
        {results.map((result) => {
          const isSelected = selectedResultIds.includes(result.result_id);
          const isFocused = focusedResultId === result.result_id;
          const isHovered = hoveredResultId === result.result_id;

          return (
            <motion.div
              key={result.place_id}
              whileHover={{ backgroundColor: "#fafbfc" }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className={isFocused ? "bg-[#f8fafc]" : isSelected ? "bg-[#fbfcfe]" : "bg-white"}
            >
              <div
                className={isFocused ? "space-y-4 border-l-2 border-[#111827] px-4 py-4 sm:px-5" : "space-y-4 px-4 py-4 sm:px-5"}
                onMouseEnter={() => onHoverResult(result.result_id)}
                onMouseLeave={() => onHoverResult(null)}
                onClick={() => onFocusResult(result.result_id)}
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${result.name}`}
                        checked={isSelected}
                        onChange={() => onToggleResult(result.result_id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mr-1 size-4 rounded-[4px] border-[#cfd6df]"
                      />
                      <Link
                        href={result.existing_lead ? (`/leads/${result.existing_lead.id}` as Route) : "#"}
                        className={
                          result.existing_lead
                            ? "text-[1.02rem] font-semibold tracking-[-0.02em] text-neutral-950 transition-colors hover:text-neutral-700"
                            : "text-[1.02rem] font-semibold tracking-[-0.02em] text-neutral-950"
                        }
                      >
                        {result.name}
                      </Link>
                      {getWebsiteBadge(result)}
                      {result.already_in_crm ? <Badge variant="success">Already in CRM</Badge> : null}
                      {isHovered && !isFocused ? <Badge>On map</Badge> : null}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-500">
                      <span>{result.primary_type_label ?? startCase(result.primary_type ?? "Restaurant")}</span>
                      {result.business_status ? <span>{startCase(result.business_status)}</span> : null}
                      {result.review_count ? <span>{result.review_count} reviews</span> : null}
                      {result.matched_subtype ? <span>{result.matched_subtype}</span> : null}
                    </div>

                    <p className="text-sm leading-6 text-neutral-500">
                      {result.formatted_address ?? "Address not returned"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:shrink-0">
                    {result.existing_lead ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/leads/${result.existing_lead.id}` as Route} onClick={(event) => event.stopPropagation()}>
                          View lead
                        </Link>
                      </Button>
                    ) : result.already_in_crm ? (
                      <span className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-sm font-medium text-neutral-500">
                        Already in CRM
                      </span>
                    ) : (
                      <DiscoveryImportDialog
                        result={result}
                        trigger={<Button size="sm">Import as lead</Button>}
                      />
                    )}
                    <Button asChild size="sm" variant="outline">
                      <a href={result.google_maps_url ?? "#"} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                        <ArrowUpRight className="size-4" />
                        Google Maps
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[#f1f3f6] pt-3 text-sm sm:grid-cols-2 xl:grid-cols-[1fr_0.8fr_1fr_1.1fr_1fr]">
                  <DiscoveryFact
                    label="Reviews"
                    value={
                      result.rating != null
                        ? `${result.rating} · ${result.review_count ?? 0} (min ${minimumReviews})`
                        : `Not available (min ${minimumReviews})`
                    }
                  />
                  <DiscoveryFact label="Price" value={formatPriceLevel(result.price_level)} />
                  <DiscoveryFact
                    label="Website"
                    value={result.website_presence === "unknown" ? "Website unclear" : "No website"}
                  />
                  <DiscoveryFact
                    label="Maps / phone"
                    value={result.phone ?? (result.location ? "Location available" : "Location hidden")}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">CRM state</p>
                    {result.existing_lead ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm text-neutral-700">{result.existing_lead.restaurant_name}</span>
                        <LeadStageBadge stage={result.existing_lead.lead_stage as LeadStage} />
                      </div>
                    ) : result.already_in_crm ? (
                      <p className="mt-1 text-sm text-neutral-700">Already in CRM</p>
                    ) : (
                      <p className="mt-1 text-sm text-neutral-700">Ready to import</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
