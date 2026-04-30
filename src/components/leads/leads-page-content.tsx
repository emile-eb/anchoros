"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight, Clock3, Map, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/app/empty-state";
import { CreateRouteDialog } from "@/components/routes/create-route-dialog";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { LeadPriorityBadge } from "@/components/leads/lead-priority-badge";
import { LeadStageBadge } from "@/components/leads/lead-stage-badge";
import { WebsiteStatusBadge } from "@/components/leads/website-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDate,
  formatPriceRange,
  isFollowUpDue,
  startCase,
} from "@/lib/formatters";
import type { LeadListFilters, LeadListItem } from "@/lib/data/leads";

export function LeadsPageContent({
  leads,
  filters,
  boroughOptions,
}: {
  leads: LeadListItem[];
  filters: LeadListFilters;
  boroughOptions: string[];
}) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const allSelected = useMemo(
    () => leads.length > 0 && selectedLeadIds.length === leads.length,
    [leads.length, selectedLeadIds.length],
  );

  const toggleLead = (leadId: string) => {
    setSelectedLeadIds((current) =>
      current.includes(leadId)
        ? current.filter((value) => value !== leadId)
        : [...current, leadId],
    );
  };

  const toggleAll = () => {
    setSelectedLeadIds(allSelected ? [] : leads.map((lead) => lead.id));
  };

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <LeadsToolbar
        filters={filters}
        boroughOptions={boroughOptions}
        selectedLeadIds={selectedLeadIds}
      />

      {selectedLeadIds.length > 0 ? (
        <div className="sticky top-16 z-20 flex flex-col gap-2 rounded-md border border-[#dfe3e8] bg-white px-3.5 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-4 text-neutral-600">
            {selectedLeadIds.length} lead{selectedLeadIds.length === 1 ? "" : "s"} selected for route creation.
          </p>
          <div className="flex flex-wrap gap-2">
            <CreateRouteDialog
              selectedLeadIds={selectedLeadIds}
              trigger={
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                  <Map className="size-4" />
                  Create route from selected
                </button>
              }
            />
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#e5e7eb] px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-[#f9fafb]"
              onClick={() => setSelectedLeadIds([])}
            >
              Clear selection
            </button>
          </div>
        </div>
      ) : null}

      {leads.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No leads match this view"
          description="Try loosening a filter, clearing search, or create the first lead to start tracking the pipeline."
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden border-[#dfe3e8] lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 z-10 border-b border-[#e9edf2] bg-white">
                  <tr className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    <th className="px-4 py-4 font-medium">
                      <input
                        type="checkbox"
                        aria-label="Select all leads"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="size-4 rounded-[4px] border-[#cfd6df]"
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">Restaurant</th>
                    <th className="px-4 py-4 font-medium">Area</th>
                    <th className="px-4 py-4 font-medium">Cuisine</th>
                    <th className="px-4 py-4 font-medium">Website</th>
                    <th className="px-4 py-4 font-medium">Stage</th>
                    <th className="px-4 py-4 font-medium">Estimate</th>
                    <th className="px-4 py-4 font-medium">Next follow-up</th>
                    <th className="px-4 py-4 font-medium">Last contacted</th>
                    <th className="px-4 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={selectedLeadIds.includes(lead.id) ? "border-b border-[#eef1f4] bg-[#f8fafc] text-sm text-neutral-600 transition-colors hover:bg-[#f5f7fa]" : "border-b border-[#eef1f4] text-sm text-neutral-600 transition-colors hover:bg-[#fafbfc]"}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ${lead.restaurant_name}`}
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => toggleLead(lead.id)}
                          className="size-4 rounded-[4px] border-[#cfd6df]"
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="space-y-1">
                          <Link href={`/leads/${lead.id}` as Route} className="block">
                            <p className="font-medium text-neutral-950 transition-colors hover:text-neutral-700">
                              {lead.restaurant_name}
                            </p>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                              {startCase(lead.lead_source)}
                            </p>
                            {lead.google_maps_url ? (
                              <a
                                href={lead.google_maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-neutral-900"
                              >
                                Maps
                                <ArrowUpRight className="size-3" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {[lead.neighborhood, lead.borough].filter(Boolean).join(" / ") || "Not set"}
                      </td>
                      <td className="px-4 py-3.5">{lead.cuisine ?? "Not set"}</td>
                      <td className="px-4 py-3.5">
                        <WebsiteStatusBadge status={lead.website_status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <LeadStageBadge stage={lead.lead_stage} />
                      </td>
                      <td className="px-4 py-3.5">
                        {formatPriceRange({
                          exact: lead.estimated_project_price,
                          low: lead.estimated_price_low,
                          high: lead.estimated_price_high,
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={isFollowUpDue(lead.next_follow_up_at) ? "font-medium text-amber-700" : ""}>
                          {formatDate(lead.next_follow_up_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{formatDate(lead.last_contacted_at)}</td>
                      <td className="px-4 py-3.5">
                        <LeadPriorityBadge priority={lead.priority} />
                      </td>
                      <td className="px-6 py-3.5">{formatDate(lead.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid min-w-0 gap-1.5 lg:hidden">
            <button
              type="button"
              className="flex min-w-0 items-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-3.5 py-2 text-left text-[11px] text-neutral-600"
              onClick={toggleAll}
            >
              <input
                type="checkbox"
                aria-label="Select all leads"
                checked={allSelected}
                readOnly
                className="size-4 rounded border-neutral-300"
              />
              Select all visible leads
            </button>
            {leads.map((lead) => (
              <motion.div key={lead.id} whileHover={{ y: -2 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Card className="border-[#e5e7eb] bg-white transition-colors hover:bg-[#fcfcfd]">
                <CardContent className="space-y-1.5 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${lead.restaurant_name}`}
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="mt-0.5 size-4 rounded border-neutral-300"
                      />
                      <div className="min-w-0 flex-1">
                        <Link href={`/leads/${lead.id}` as Route} className="block min-w-0 text-[14px] font-semibold leading-5 tracking-tight text-neutral-950">
                          {lead.restaurant_name}
                        </Link>
                        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] leading-4 text-neutral-500">
                          <span className="min-w-0 truncate">
                            {startCase(lead.lead_source)}
                          </span>
                          {lead.google_maps_url ? (
                            <a
                              href={lead.google_maps_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-neutral-900"
                            >
                              Maps
                              <ArrowUpRight className="size-3.5" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <LeadPriorityBadge priority={lead.priority} />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-1">
                    <LeadStageBadge stage={lead.lead_stage} />
                    <WebsiteStatusBadge status={lead.website_status} />
                  </div>
                  <div className="flex min-w-0 items-center gap-2 border-t border-[#f1f3f6] pt-1.5 text-[11px]">
                    <Clock3 className="size-3.5 shrink-0 text-neutral-400" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          lead.next_follow_up_at
                            ? isFollowUpDue(lead.next_follow_up_at)
                              ? "truncate font-medium text-amber-700"
                              : "truncate text-neutral-700"
                            : "truncate text-neutral-500"
                        }
                      >
                        {lead.next_follow_up_at ? `Follow-up ${formatDate(lead.next_follow_up_at)}` : "Follow-up missing"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
