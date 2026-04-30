import {
  getMissingEnvVars,
  hasGoogleMapsBrowserEnv,
  hasGoogleMapsEnv,
  hasSupabaseEnv,
  hasSupabaseServiceRoleEnv,
} from "@/lib/env";
import { DiscoveryWorkspace } from "@/components/discovery/discovery-workspace";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const jobId = Array.isArray(params.job) ? params.job[0] : params.job;
  const searchEnabled =
    hasGoogleMapsEnv() && hasSupabaseEnv() && hasSupabaseServiceRoleEnv();
  const mapEnabled = hasGoogleMapsBrowserEnv();
  const missingDiscoveryEnv = [
    ...getMissingEnvVars(),
    ...(hasGoogleMapsEnv() ? [] : ["GOOGLE_MAPS_API_KEY"]),
    ...(hasSupabaseServiceRoleEnv() ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
    ...(hasGoogleMapsBrowserEnv()
      ? []
      : ["NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY", "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID"]),
  ];

  return (
    <DiscoveryWorkspace
      initialJobId={jobId}
      searchEnabled={searchEnabled}
      mapEnabled={mapEnabled}
      missingDiscoveryEnv={missingDiscoveryEnv}
    />
  );
}
