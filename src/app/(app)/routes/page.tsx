import { RoutesWorkspace } from "@/components/routes/routes-workspace";
import { getRoutesPageData } from "@/lib/data/routes";

function readCsvParam(
  value: string | string[] | undefined,
) {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) {
    return [];
  }

  return first
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedLeadIds = readCsvParam(params.leadIds);
  const selectedDiscoveryResultIds = readCsvParam(params.discoveryResultIds);
  const { workspace, routes } = await getRoutesPageData();

  return (
    <RoutesWorkspace
      workspaceName={workspace.name}
      routes={routes}
      selectedLeadIds={selectedLeadIds}
      selectedDiscoveryResultIds={selectedDiscoveryResultIds}
      defaultCreateOpen={selectedLeadIds.length > 0 || selectedDiscoveryResultIds.length > 0}
    />
  );
}
