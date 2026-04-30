import { ArrowLeft, ArrowUpRight, Clock3, Mail, MapPin, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";
import { LeadPriorityBadge } from "@/components/leads/lead-priority-badge";
import { LeadStageBadge } from "@/components/leads/lead-stage-badge";
import { WebsiteStatusBadge } from "@/components/leads/website-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPriceRange,
  inferBoroughFromAddress,
  startCase,
} from "@/lib/formatters";
import {
  getLeadDetailPageData,
  type LeadNoteItem,
  type OutreachEventItem,
  type VisitItem,
} from "@/lib/data/leads";

type ActivityItem =
  | { id: string; type: "note"; occurredAt: string; title: string; summary: string; meta: string[] }
  | { id: string; type: "outreach"; occurredAt: string; title: string; summary: string; meta: string[] }
  | { id: string; type: "visit"; occurredAt: string; title: string; summary: string; meta: string[] };

function InlineDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">{label}</p>
      <p className="text-sm leading-6 text-neutral-700">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">{label}</p>
      <p className="text-sm leading-6 text-neutral-700">{value}</p>
    </div>
  );
}

function ActivitySection({
  title,
  description,
  count,
  empty,
  children,
}: {
  title: string;
  description: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 border-b border-[#eceff3] pb-3">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.02em] text-neutral-950">{title}</h3>
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{count}</p>
      </div>
      {count === 0 ? (
        <div className="border border-dashed border-[#dfe3e8] bg-[#fcfcfd] px-4 py-4 text-sm text-neutral-500">
          {empty}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function buildActivityItems(
  notes: LeadNoteItem[],
  outreachEvents: OutreachEventItem[],
  visits: VisitItem[],
): ActivityItem[] {
  const noteItems: ActivityItem[] = notes.map((note) => ({
    id: note.id,
    type: "note",
    occurredAt: note.created_at,
    title: "Note added",
    summary: note.content,
    meta: [
      note.author?.full_name ?? note.author?.email ?? "Unknown author",
      formatDateTime(note.created_at),
    ],
  }));

  const outreachItems: ActivityItem[] = outreachEvents.map((event) => ({
    id: event.id,
    type: "outreach",
    occurredAt: event.occurred_at,
    title: startCase(event.outreach_type),
    summary: event.summary,
    meta: [
      event.outcome ? `Outcome: ${startCase(event.outcome)}` : "Outcome not set",
      `By ${event.author?.full_name ?? event.author?.email ?? "Unknown"}`,
      `At ${formatDateTime(event.occurred_at)}`,
    ],
  }));

  const visitItems: ActivityItem[] = visits.map((visit) => ({
    id: visit.id,
    type: "visit",
    occurredAt: visit.visited_at,
    title: visit.outcome ? startCase(visit.outcome) : "Visit logged",
    summary: visit.notes ?? "No visit notes.",
    meta: [
      visit.best_time_to_return ? `Best time: ${visit.best_time_to_return}` : "Best time not set",
      `By ${visit.author?.full_name ?? visit.author?.email ?? "Unknown"}`,
      `At ${formatDateTime(visit.visited_at)}`,
    ],
  }));

  return [...outreachItems, ...visitItems, ...noteItems].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { lead, notes, outreachEvents, visits } = await getLeadDetailPageData(id);

  const timeline = buildActivityItems(notes, outreachEvents, visits);
  const nextFollowUpLabel = formatDateTime(lead.next_follow_up_at);
  const lastContactLabel = formatDateTime(lead.last_contacted_at);
  const resolvedBorough = inferBoroughFromAddress(lead.address) ?? lead.borough ?? "Not set";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="size-4" />
          Back to leads
        </Link>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5 border border-[#e6e8ec] bg-white px-6 py-6">
          <div className="flex flex-wrap gap-1.5">
            <LeadStageBadge stage={lead.lead_stage === "qualified" || lead.lead_stage === "on_hold" ? "researching" : lead.lead_stage} />
            <LeadPriorityBadge priority={lead.priority} />
            <WebsiteStatusBadge status={lead.website_status} />
          </div>

          <div className="space-y-2">
            <h1 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-neutral-950">
              {lead.restaurant_name}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-500">
              {[resolvedBorough, lead.cuisine].filter(Boolean).join(" · ") || "Borough and cuisine can be added here."}
            </p>
          </div>

          <div className="grid gap-3 border-y border-[#eceff3] py-4 text-sm text-neutral-500 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-neutral-400" />
              Updated {formatDate(lead.updated_at)}
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-neutral-400" />
              {lead.creator?.full_name ?? lead.creator?.email ?? "Unknown"}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-neutral-400" />
              {lead.address ?? "Address not set"}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InlineDetail label="Next follow-up" value={nextFollowUpLabel} />
            <InlineDetail label="Last contacted" value={lastContactLabel} />
            <InlineDetail label="Lead source" value={startCase(lead.lead_source)} />
          </div>

          {lead.google_maps_url ? (
            <div className="border-t border-[#eceff3] pt-4">
              <a
                href={lead.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950"
              >
                Open in Google Maps
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <LeadDetailActions lead={lead} />
          <Card className="border-[#e6e8ec]">
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Current state</CardTitle>
              <CardDescription>What matters now and what should happen next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="border border-[#eceff3] px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Next follow-up</p>
                  <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-neutral-950">{nextFollowUpLabel}</p>
                </div>
                <div className="border border-[#eceff3] px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Recent activity</p>
                  <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-neutral-950">
                    {timeline[0] ? timeline[0].title : "No activity yet"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {timeline[0] ? formatDateTime(timeline[0].occurredAt) : "Add the first note, outreach, or visit."}
                  </p>
                </div>
              </div>
              <div className="border-t border-[#eceff3] pt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Status notes</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {lead.status_notes ?? "No status notes yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="border-[#e6e8ec]">
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Account overview</CardTitle>
              <CardDescription>Business identity, source context, and current commercial picture.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-[#eef1f4]">
              <DetailRow label="Neighborhood" value={lead.neighborhood ?? "Not set"} />
              <DetailRow label="Borough" value={resolvedBorough} />
              <DetailRow label="Cuisine" value={lead.cuisine ?? "Not set"} />
              <DetailRow label="Address" value={lead.address ?? "Not set"} />
              <DetailRow label="Instagram" value={lead.instagram_handle ?? "Not set"} />
              <DetailRow label="Website status" value={startCase(lead.website_status)} />
              <DetailRow label="Existing website" value={lead.existing_website_url ?? "Not set"} />
              <DetailRow
                label="Estimated range"
                value={formatPriceRange({
                  exact: lead.estimated_project_price,
                  low: lead.estimated_price_low,
                  high: lead.estimated_price_high,
                })}
              />
              <DetailRow label="Exact estimate" value={formatCurrency(lead.estimated_project_price)} />
            </CardContent>
          </Card>

          <Card className="border-[#e6e8ec]">
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent notes, outreach, and visits in one working stream.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivitySection
                title="Recent timeline"
                description="The most recent activity across notes, outreach, and in-person work."
                count={timeline.length}
                empty="No activity yet. Add a note, log outreach, or record a visit to start the operational history."
              >
                <div className="space-y-0">
                  {timeline.map((item, index) => (
                    <div key={`${item.type}-${item.id}`} className={index === 0 ? "grid gap-2 py-4" : "grid gap-2 border-t border-[#eef1f4] py-4"}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-[5px] border border-[#e5e7eb] bg-[#f8fafc] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em] text-neutral-500">
                            {item.type}
                          </span>
                          <p className="text-sm font-medium text-neutral-950">{item.title}</p>
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">{formatDateTime(item.occurredAt)}</p>
                      </div>
                      <p className="text-sm leading-6 text-neutral-600">{item.summary}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                        {item.meta.map((meta) => (
                          <span key={meta}>{meta}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ActivitySection>

              <div className="grid gap-6 xl:grid-cols-2">
                <ActivitySection
                  title="Outreach history"
                  description="Every outbound touchpoint recorded on this lead."
                  count={outreachEvents.length}
                  empty="No outreach logged yet."
                >
                  <div className="space-y-0">
                    {outreachEvents.map((event, index) => (
                      <div key={event.id} className={index === 0 ? "grid gap-2 py-3" : "grid gap-2 border-t border-[#eef1f4] py-3"}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-neutral-950">{startCase(event.outreach_type)}</p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">{formatDateTime(event.occurred_at)}</p>
                        </div>
                        <p className="text-sm leading-6 text-neutral-600">{event.summary}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                          <span>Outcome: {event.outcome ? startCase(event.outcome) : "Not set"}</span>
                          <span>Next follow-up: {formatDateTime(event.next_follow_up_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ActivitySection>

                <ActivitySection
                  title="Visit history"
                  description="On-site notes, outcomes, and return guidance."
                  count={visits.length}
                  empty="No visits logged yet."
                >
                  <div className="space-y-0">
                    {visits.map((visit, index) => (
                      <div key={visit.id} className={index === 0 ? "grid gap-2 py-3" : "grid gap-2 border-t border-[#eef1f4] py-3"}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-neutral-950">{visit.outcome ? startCase(visit.outcome) : "Visit logged"}</p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">{formatDateTime(visit.visited_at)}</p>
                        </div>
                        <p className="text-sm leading-6 text-neutral-600">{visit.notes ?? "No visit notes."}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                          <span>Best time to return: {visit.best_time_to_return ?? "Not set"}</span>
                          <span>By {visit.author?.full_name ?? visit.author?.email ?? "Unknown"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ActivitySection>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-[#e6e8ec]">
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Contact and channels</CardTitle>
              <CardDescription>Who to reach and where the conversation can happen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 size-4 text-neutral-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Contact</p>
                  <p className="mt-1 text-sm text-neutral-700">{lead.contact_name ?? "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 text-neutral-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Phone</p>
                  <p className="mt-1 text-sm text-neutral-700">{lead.phone ?? "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 text-neutral-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Email</p>
                  <p className="mt-1 text-sm text-neutral-700">{lead.email ?? "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-neutral-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Google Maps</p>
                  {lead.google_maps_url ? (
                    <a
                      href={lead.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 break-all text-sm text-neutral-700 transition-colors hover:text-neutral-950"
                    >
                      {lead.google_maps_url}
                      <ArrowUpRight className="size-4 shrink-0" />
                    </a>
                  ) : (
                    <p className="mt-1 break-all text-sm text-neutral-700">Not imported</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e6e8ec]">
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Commercial context</CardTitle>
              <CardDescription>Website quality, pricing context, and source information.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-[#eef1f4]">
              <DetailRow label="Lead source" value={startCase(lead.lead_source)} />
              <DetailRow
                label="Google rating"
                value={
                  lead.google_rating != null
                    ? `${lead.google_rating} (${lead.google_review_count ?? 0} reviews)`
                    : "Not imported"
                }
              />
              <DetailRow label="Google status" value={lead.google_business_status ? startCase(lead.google_business_status) : "Not imported"} />
              <DetailRow label="Primary type" value={lead.google_primary_type ?? "Not imported"} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
