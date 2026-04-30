import type { LeadStage } from "@/lib/types/database";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";

type DashboardLeadRow = {
  id: string;
  restaurant_name: string;
  lead_stage: LeadStage;
  estimated_project_price: number | null;
  estimated_price_low: number | null;
  estimated_price_high: number | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getDashboardSummary() {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return {
      workspace,
      totalLeads: 0,
      byStage: [],
      needingFollowUp: 0,
      leadsAddedThisWeek: 0,
      estimatedPipelineValue: 0,
      recentLeads: [] as DashboardLeadRow[],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, restaurant_name, lead_stage, estimated_project_price, estimated_price_low, estimated_price_high, next_follow_up_at, created_at, updated_at",
    )
    .eq("workspace_id", workspace.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const leads = (data ?? []) as DashboardLeadRow[];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const byStage = new Map<LeadStage, number>();
  let needingFollowUp = 0;
  let leadsAddedThisWeek = 0;
  let estimatedPipelineValue = 0;

  for (const lead of leads) {
    byStage.set(lead.lead_stage, (byStage.get(lead.lead_stage) ?? 0) + 1);

    if (lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= Date.now()) {
      needingFollowUp += 1;
    }

    if (new Date(lead.created_at).getTime() >= weekAgo) {
      leadsAddedThisWeek += 1;
    }

    estimatedPipelineValue +=
      lead.estimated_project_price ??
      lead.estimated_price_high ??
      lead.estimated_price_low ??
      0;
  }

  return {
    workspace,
    totalLeads: leads.length,
    byStage: Array.from(byStage.entries()).map(([stage, count]) => ({ stage, count })),
    needingFollowUp,
    leadsAddedThisWeek,
    estimatedPipelineValue,
    recentLeads: leads.slice(0, 6),
  };
}
