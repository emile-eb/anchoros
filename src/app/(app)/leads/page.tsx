import { LeadsPageContent } from "@/components/leads/leads-page-content";
import {
  getLeadFiltersFromSearchParams,
  getLeadsPageData,
} from "@/lib/data/leads";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = getLeadFiltersFromSearchParams(await searchParams);
  const { leads, boroughOptions } = await getLeadsPageData(filters);

  return <LeadsPageContent leads={leads} filters={filters} boroughOptions={boroughOptions} />;
}
