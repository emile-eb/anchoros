import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Layers3,
  ListTodo,
  PlusSquare,
  Users,
} from "lucide-react";
import { PageIntro } from "@/components/app/page-intro";
import { SummaryCard } from "@/components/app/summary-card";
import { LeadStageBadge } from "@/components/leads/lead-stage-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { formatCurrency, formatDate, formatPriceRange } from "@/lib/formatters";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  const mobileMetrics = [
    {
      label: "Need follow-up",
      value: summary.needingFollowUp.toString(),
      detail: "Due now",
      href: "/leads?sort=next_follow_up_soonest" as Route,
      icon: <CalendarClock className="size-4" />,
    },
    {
      label: "Added this week",
      value: summary.leadsAddedThisWeek.toString(),
      detail: "New this week",
      href: "/leads?sort=newest" as Route,
      icon: <PlusSquare className="size-4" />,
    },
    {
      label: "Total leads",
      value: summary.totalLeads.toString(),
      detail: "Active records",
      href: "/leads" as Route,
      icon: <Users className="size-4" />,
    },
    {
      label: "Pipeline value",
      value: formatCurrency(summary.estimatedPipelineValue),
      detail: "Upper range",
      href: "/leads" as Route,
      icon: <CircleDollarSign className="size-4" />,
    },
  ];

  const topStages = summary.byStage.slice(0, 4);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-3.5 md:hidden">
        <section className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">
            {summary.workspace.name}
          </p>
          <div className="space-y-0.5">
            <h1 className="text-[1.62rem] font-semibold tracking-[-0.05em] text-neutral-950">
              Dashboard
            </h1>
            <p className="max-w-[18rem] text-[12px] leading-4 text-neutral-500">
              What needs attention now.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          {mobileMetrics.map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className="rounded-md border border-[#e6e9ee] bg-white px-3 py-2 transition-colors hover:bg-[#fafbfc]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[1.04rem] font-semibold leading-none tracking-[-0.04em] text-neutral-950">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.13em] text-neutral-400">
                    {metric.label}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-neutral-500">
                    {metric.detail}
                  </p>
                </div>
                <div className="mt-0.5 shrink-0 text-neutral-400">{metric.icon}</div>
              </div>
            </Link>
          ))}
        </section>

        <section className="space-y-2">
          <div className="rounded-md border border-[#e6e9ee] bg-white px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                  Action now
                </h2>
                <p className="mt-0.5 text-[11px] leading-4 text-neutral-500">
                  Focus the next due leads.
                </p>
              </div>
              <Link
                href={"/leads?sort=next_follow_up_soonest" as Route}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#e6e9ee] px-2.5 py-1.5 text-[11px] font-medium text-neutral-700"
              >
                Open
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <Link
                href={"/leads?sort=next_follow_up_soonest" as Route}
                className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-[#eceff3] bg-[#fbfcfd] px-3 py-2.5 transition-colors hover:bg-[#f7f9fb]"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    Need follow-up
                  </p>
                  <p className="mt-1 text-base font-semibold leading-none tracking-[-0.04em] text-neutral-950">
                    {summary.needingFollowUp}
                  </p>
                </div>
                <ChevronRight className="size-3.5 shrink-0 text-neutral-400" />
              </Link>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                  Active stages
                </p>
                <p className="mt-1 text-sm font-semibold tracking-[-0.03em] text-neutral-950">
                  {summary.byStage.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#e6e9ee] bg-white px-3.5 py-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold tracking-[-0.02em] text-neutral-950">
                Stage snapshot
              </h3>
              <Link href={"/leads" as Route} className="text-[11px] font-medium text-neutral-600">
                View all
              </Link>
            </div>
            {summary.byStage.length === 0 ? (
              <p className="text-[11px] leading-4 text-neutral-500">No leads in the pipeline yet.</p>
            ) : (
              <div className="space-y-1">
                {topStages.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between gap-3 py-1">
                    <div className="min-w-0">
                      <LeadStageBadge stage={item.stage} />
                    </div>
                    <span className="font-mono text-[12px] font-semibold text-neutral-900">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-md border border-[#e6e9ee] bg-white">
          <div className="flex items-center justify-between border-b border-[#eceff3] px-3.5 py-2.5">
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                Recently updated leads
              </h2>
              <p className="mt-0.5 text-[11px] leading-4 text-neutral-500">
                Recent movement.
              </p>
            </div>
            <Link href={"/leads" as Route} className="text-[11px] font-medium text-neutral-600">
              All leads
            </Link>
          </div>

          <div className="divide-y divide-[#eef1f4]">
            {summary.recentLeads.length === 0 ? (
              <p className="px-3.5 py-4 text-sm leading-5 text-neutral-500">
                Once leads are added, recent activity will appear here.
              </p>
            ) : (
              summary.recentLeads.map((lead) => {
                const hasEstimate =
                  !!lead.estimated_project_price ||
                  !!lead.estimated_price_low ||
                  !!lead.estimated_price_high;

                return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}` as Route}
                  className="block px-3.5 py-2 transition-colors hover:bg-[#fafbfc]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium leading-5 text-neutral-950">
                        {lead.restaurant_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] leading-4 text-neutral-500">
                        <span>Updated {formatDate(lead.updated_at)}</span>
                        <span className="text-neutral-300">·</span>
                        <span className={lead.next_follow_up_at ? "" : "text-neutral-400/90"}>
                          {lead.next_follow_up_at
                            ? `Follow-up ${formatDate(lead.next_follow_up_at)}`
                            : "Follow-up unset"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                        {hasEstimate ? (
                          <div className="text-[10px] font-medium text-neutral-700">
                            {formatPriceRange({
                              exact: lead.estimated_project_price,
                              low: lead.estimated_price_low,
                              high: lead.estimated_price_high,
                            })}
                          </div>
                        ) : null}
                        <ChevronRight className="size-3.5 text-neutral-400" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-md border border-[#e6e9ee] bg-white px-3.5 py-3">
          <div className="flex items-start gap-3 text-[12px] leading-5 text-neutral-600">
            <ListTodo className="mt-0.5 size-4 shrink-0 text-neutral-400" />
            Update stage when the conversation moves, log every touchpoint, and keep the next
            follow-up date clean.
          </div>
        </section>
      </div>

      <div className="hidden space-y-8 md:block">
        <PageIntro
          eyebrow={summary.workspace.name}
          title="Dashboard"
          description="A precise read on the pipeline: what needs attention, what moved recently, and where the current value sits."
        />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Total leads"
            value={summary.totalLeads.toString()}
            detail="All active CRM records"
            icon={<Users className="size-5" />}
            href={"/leads" as Route}
          />
          <SummaryCard
            label="Need follow-up"
            value={summary.needingFollowUp.toString()}
            detail="Due now or overdue"
            icon={<CalendarClock className="size-5" />}
            href={"/leads?sort=next_follow_up_soonest" as Route}
          />
          <SummaryCard
            label="Added this week"
            value={summary.leadsAddedThisWeek.toString()}
            detail="Created in the last 7 days"
            icon={<PlusSquare className="size-5" />}
            href={"/leads?sort=newest" as Route}
          />
          <SummaryCard
            label="Pipeline value"
            value={formatCurrency(summary.estimatedPipelineValue)}
            detail="Exact estimate or upper range"
            icon={<CircleDollarSign className="size-5" />}
            href={"/leads" as Route}
          />
          <SummaryCard
            label="Active stages"
            value={summary.byStage.length.toString()}
            detail="Distinct stages in use"
            icon={<Layers3 className="size-5" />}
            href={"/leads" as Route}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Leads by stage</CardTitle>
              <CardDescription>Current distribution across the working pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-[#eef1f4] px-0 pb-0">
              {summary.byStage.length === 0 ? (
                <p className="px-5 py-5 text-sm text-neutral-500">No leads yet.</p>
              ) : (
                summary.byStage.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between px-5 py-3.5">
                    <LeadStageBadge stage={item.stage} />
                    <span className="font-mono text-sm font-semibold text-neutral-900">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-[#eceff3]">
              <CardTitle>Recently updated leads</CardTitle>
              <CardDescription>The fastest path back into active work.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-[#eef1f4] px-0 pb-0">
              {summary.recentLeads.length === 0 ? (
                <p className="px-5 py-5 text-sm text-neutral-500">
                  Once leads are added, the most recently updated records will appear here.
                </p>
              ) : (
                summary.recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}` as Route}
                    className="block px-5 py-4 transition-colors hover:bg-[#fafbfc]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-950">{lead.restaurant_name}</p>
                        <p className="mt-1 text-sm text-neutral-500">
                          Updated {formatDate(lead.updated_at)} · Follow-up{" "}
                          {formatDate(lead.next_follow_up_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-sm font-medium text-neutral-700">
                        {formatPriceRange({
                          exact: lead.estimated_project_price,
                          low: lead.estimated_price_low,
                          high: lead.estimated_price_high,
                        })}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="border-b border-[#eceff3]">
            <CardTitle>Operating note</CardTitle>
            <CardDescription>Keep the system sparse and current.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-3 text-sm leading-6 text-neutral-600">
            <ListTodo className="mt-0.5 size-4 shrink-0 text-neutral-400" />
            The CRM is designed to make the next action obvious: update stage when the
            conversation moves, log every touchpoint, and keep the next follow-up date clean.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
