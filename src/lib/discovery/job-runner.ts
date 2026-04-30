import { createAdminClient } from "@/lib/supabase/admin";
import {
  DISCOVERY_COORDINATE_DEDUPE_THRESHOLD_METERS,
  DISCOVERY_MAX_DETAIL_ENRICHMENTS_PER_JOB,
  DISCOVERY_MAX_FINAL_RESULTS_PER_JOB,
  DISCOVERY_MAX_RETRIEVAL_PASSES_PER_TILE,
  DISCOVERY_TILE_RADIUS_METERS,
  DISCOVERY_TILE_SPACING_METERS,
} from "@/lib/discovery/config";
import { distanceMeters, pointInRegion } from "@/lib/discovery/geometry";
import { buildDiscoveryTiles } from "@/lib/discovery/grid";
import { scoreSubtypeMatch } from "@/lib/discovery/subtypes";
import type {
  DiscoveryDebugSummary,
  DiscoveryRegionData,
  DiscoverySubtypeMode,
} from "@/lib/discovery/types";
import { geocodeAreaQuery } from "@/lib/google-maps/geocoding";
import {
  enrichDiscoveryPlace,
  mapDiscoveryPlace,
  searchDiscoveryTile,
} from "@/lib/google-maps/discovery";
import type { Database } from "@/lib/types/database";
import type { DiscoveryJobRequestValues } from "@/lib/validators/discovery";

type RawCandidate = ReturnType<typeof mapDiscoveryPlace>;

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildFallbackKey(name: string | null | undefined, address: string | null | undefined) {
  const normalizedName = normalizeText(name);
  const normalizedAddress = normalizeText(address);
  if (!normalizedName || !normalizedAddress) {
    return null;
  }

  return `${normalizedName}::${normalizedAddress}`;
}

function areSimilarNames(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) {
    return false;
  }

  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }

  const leftTokens = new Set(left.split(" "));
  const rightTokens = new Set(right.split(" "));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 && overlap / union >= 0.75;
}

function compareCandidateQuality(a: RawCandidate, b: RawCandidate) {
  return (
    (b.review_count ?? -1) - (a.review_count ?? -1) ||
    (b.rating ?? -1) - (a.rating ?? -1) ||
    (b.subtype_score ?? 0) - (a.subtype_score ?? 0)
  );
}

function rankFinalCandidate(candidate: RawCandidate, alreadyInCrm: boolean) {
  return (
    (alreadyInCrm ? -10_000 : 0) +
    (candidate.review_count ?? 0) * 3 +
    (candidate.rating ?? 0) * 20 +
    (candidate.subtype_score ?? 0) * 18 +
    (candidate.business_status === "OPERATIONAL" ? 12 : 0)
  );
}

async function updateJob(
  jobId: string,
  values: Database["public"]["Tables"]["discovery_jobs"]["Update"],
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("discovery_jobs").update(values).eq("id", jobId);
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveJobRegion(input: DiscoveryJobRequestValues): Promise<{
  region: DiscoveryRegionData;
  resolvedQuery: string;
}> {
  if (input.searchMode === "quick_area") {
    const geocodedArea = await geocodeAreaQuery(input.query ?? "");
    return {
      resolvedQuery: geocodedArea.formattedAddress,
      region: {
        type: "geocoded_area",
        label: geocodedArea.formattedAddress,
        center: geocodedArea.location,
        bounds: geocodedArea.viewport,
      },
    };
  }

  return {
    region: input.regionData,
    resolvedQuery: input.query?.trim() || input.regionData.label || "Exact region",
  };
}

function maybeReplaceDuplicate(
  uniqueCandidates: RawCandidate[],
  candidate: RawCandidate,
) {
  if (candidate.place_id) {
    const exactMatch = uniqueCandidates.find((existing) => existing.place_id === candidate.place_id);
    if (exactMatch) {
      if (compareCandidateQuality(exactMatch, candidate) > 0) {
        uniqueCandidates.splice(uniqueCandidates.indexOf(exactMatch), 1, candidate);
      }
      return true;
    }
  }

  const fallbackKey = buildFallbackKey(candidate.name, candidate.formatted_address);
  if (fallbackKey) {
    const fallbackMatch = uniqueCandidates.find(
      (existing) => buildFallbackKey(existing.name, existing.formatted_address) === fallbackKey,
    );
    if (fallbackMatch) {
      if (compareCandidateQuality(fallbackMatch, candidate) > 0) {
        uniqueCandidates.splice(uniqueCandidates.indexOf(fallbackMatch), 1, candidate);
      }
      return true;
    }
  }

  if (candidate.location) {
    const nearbyDuplicate = uniqueCandidates.find((existing) => {
      if (!existing.location) {
        return false;
      }

        return (
          areSimilarNames(existing.name, candidate.name) &&
        distanceMeters(existing.location, candidate.location!) <=
          DISCOVERY_COORDINATE_DEDUPE_THRESHOLD_METERS
        );
    });

    if (nearbyDuplicate) {
      if (compareCandidateQuality(nearbyDuplicate, candidate) > 0) {
        uniqueCandidates.splice(uniqueCandidates.indexOf(nearbyDuplicate), 1, candidate);
      }
      return true;
    }
  }

  return false;
}

function createDebugSummary(
  input: DiscoveryJobRequestValues,
  region: DiscoveryRegionData,
  values: Partial<DiscoveryDebugSummary>,
): DiscoveryDebugSummary {
  return {
    searchMode: input.searchMode,
    regionType: region.type,
    exactGeometry: input.searchMode === "exact_region",
    rawQuery: input.query?.trim() || null,
    minimumReviews: input.minimumReviews,
    subtype: input.subtype || null,
      subtypeMode: input.subtypeMode as DiscoverySubtypeMode,
    businessType: input.businessType,
    desiredFinalResults: input.limit,
    tileRadiusMeters: DISCOVERY_TILE_RADIUS_METERS,
    tileSpacingMeters: DISCOVERY_TILE_SPACING_METERS,
    retrievalPassesPerTile: DISCOVERY_MAX_RETRIEVAL_PASSES_PER_TILE,
    totalTiles: 0,
    rawCandidates: 0,
    uniqueCandidates: 0,
    droppedForWebsite: 0,
    droppedForLowReviews: 0,
    droppedForSubtype: 0,
    passedReviewFilter: 0,
    passedNoWebsiteFilter: 0,
    finalSavedCandidates: 0,
    safetyCapHit: false,
    ...values,
  };
}

export async function runDiscoveryJob(jobId: string, input: DiscoveryJobRequestValues) {
  const supabase = createAdminClient();

  try {
    const { data: jobRow, error: jobError } = await supabase
      .from("discovery_jobs")
      .select("workspace_id")
      .eq("id", jobId)
      .single();

    if (jobError || !jobRow) {
      throw new Error(jobError?.message ?? "Discovery job not found.");
    }

    const workspaceId = jobRow.workspace_id;

    await updateJob(jobId, {
      status: "running",
      current_phase: "Preparing region",
      started_at: new Date().toISOString(),
      error_message: null,
    });

    const { region, resolvedQuery } = await resolveJobRegion(input);

    const tiles = buildDiscoveryTiles(region);

    await updateJob(jobId, {
      current_phase: "Building search grid",
      total_tiles: tiles.length,
      search_mode: input.searchMode,
      raw_query: input.query?.trim() || null,
      region_type: region.type,
      region_data: region as unknown as Database["public"]["Tables"]["discovery_jobs"]["Update"]["region_data"],
      minimum_reviews: input.minimumReviews,
      subtype: input.subtype || null,
      subtype_mode: input.subtypeMode as DiscoverySubtypeMode,
      no_website_only: input.noWebsiteOnly,
      desired_final_results: input.limit,
      exact_geometry: input.searchMode === "exact_region",
      debug_summary: createDebugSummary(input, region, {
        totalTiles: tiles.length,
      }) as unknown as Database["public"]["Tables"]["discovery_jobs"]["Update"]["debug_summary"],
    });

    const rawCandidates: RawCandidate[] = [];

    for (const tile of tiles) {
      await updateJob(jobId, {
        current_phase: `Sweeping tile ${tile.index + 1} of ${tiles.length}`,
        completed_tiles: tile.index,
        raw_places_found: rawCandidates.length,
      });

      const places = await searchDiscoveryTile({
        latitude: tile.latitude,
        longitude: tile.longitude,
        radiusMeters: tile.radiusMeters,
        businessType: input.businessType,
        region,
        subtype: input.subtype,
        subtypeMode: input.subtypeMode as DiscoverySubtypeMode,
      });

      rawCandidates.push(
        ...places
          .filter((place) => place.id)
          .map((place) =>
            mapDiscoveryPlace(place, resolvedQuery, {
              subtype: input.subtype,
              subtypeMode: input.subtypeMode as DiscoverySubtypeMode,
            }),
          ),
      );

      await updateJob(jobId, {
        completed_tiles: tile.index + 1,
        raw_places_found: rawCandidates.length,
      });
    }

    await updateJob(jobId, {
      current_phase: "Deduping candidates",
      raw_places_found: rawCandidates.length,
    });

    const uniqueCandidates: RawCandidate[] = [];

    for (const candidate of rawCandidates.sort(compareCandidateQuality)) {
      if (!maybeReplaceDuplicate(uniqueCandidates, candidate)) {
        uniqueCandidates.push(candidate);
      }
    }

    await updateJob(jobId, {
      unique_places_found: uniqueCandidates.length,
      current_phase: "Checking websites",
    });

    const websiteCheckedCandidates: RawCandidate[] = [];
    let detailChecks = 0;
    let droppedForWebsite = 0;

    for (const candidate of uniqueCandidates) {
      let nextCandidate = candidate;

      if (candidate.place_id && detailChecks < DISCOVERY_MAX_DETAIL_ENRICHMENTS_PER_JOB) {
        const details = await enrichDiscoveryPlace(candidate.place_id);
        nextCandidate = mapDiscoveryPlace(details, resolvedQuery, {
          subtype: input.subtype,
          subtypeMode: input.subtypeMode as DiscoverySubtypeMode,
        });
        detailChecks += 1;
      }

      if (nextCandidate.location && !pointInRegion(nextCandidate.location, region)) {
        continue;
      }

      if (nextCandidate.website_url) {
        droppedForWebsite += 1;
        continue;
      }

      websiteCheckedCandidates.push(nextCandidate);
    }

    await updateJob(jobId, {
      current_phase: "Filtering by reviews and subtype",
      candidates_passing_no_website_filter: websiteCheckedCandidates.length,
      candidates_dropped_has_website: droppedForWebsite,
    });

    let droppedForLowReviews = 0;
    let droppedForSubtype = 0;

    const reviewAndSubtypeCandidates = websiteCheckedCandidates.filter((candidate) => {
      if ((candidate.review_count ?? 0) < input.minimumReviews) {
        droppedForLowReviews += 1;
        return false;
      }

      const subtypeMatch = scoreSubtypeMatch(
        {
          primaryType: candidate.primary_type,
          primaryTypeLabel: candidate.primary_type_label,
          name: candidate.name,
          types: candidate.types,
        },
        input.subtype,
        input.subtypeMode as DiscoverySubtypeMode,
      );

      if (input.subtype && input.subtypeMode === "strict" && !subtypeMatch.passesStrict) {
        droppedForSubtype += 1;
        return false;
      }

      return true;
    });

    const { data: leadRows, error: leadError } = await supabase
      .from("leads")
      .select("id, workspace_id, restaurant_name, address, google_place_id")
      .eq("workspace_id", workspaceId);

    if (leadError) {
      throw new Error(leadError.message);
    }

    const leads = leadRows ?? [];
    const leadByPlaceId = new Map(
      leads.filter((lead) => lead.google_place_id).map((lead) => [lead.google_place_id as string, lead]),
    );
    const leadByFallback = new Map(
      leads
        .map((lead) => [buildFallbackKey(lead.restaurant_name, lead.address), lead] as const)
        .filter((entry): entry is [string, (typeof leads)[number]] => Boolean(entry[0])),
    );

    const rankedCandidates = reviewAndSubtypeCandidates
      .map((candidate) => {
        const existingLead =
          leadByPlaceId.get(candidate.place_id) ??
          leadByFallback.get(buildFallbackKey(candidate.name, candidate.formatted_address) ?? "");

        return { candidate, existingLead };
      })
      .sort(
        (a, b) =>
          rankFinalCandidate(b.candidate, Boolean(b.existingLead)) -
          rankFinalCandidate(a.candidate, Boolean(a.existingLead)),
      );

    const safetyCapHit =
      rankedCandidates.length > Math.min(input.limit, DISCOVERY_MAX_FINAL_RESULTS_PER_JOB);

    const finalResults = rankedCandidates
      .slice(0, Math.min(input.limit, DISCOVERY_MAX_FINAL_RESULTS_PER_JOB))
      .map(({ candidate, existingLead }) => {
        return {
          discovery_job_id: jobId,
          workspace_id: workspaceId,
          google_place_id: candidate.place_id || null,
          restaurant_name: candidate.name,
          formatted_address: candidate.formatted_address,
          latitude: candidate.location?.latitude ?? null,
          longitude: candidate.location?.longitude ?? null,
          primary_type: candidate.primary_type,
          rating: candidate.rating,
          review_count: candidate.review_count,
          price_level: candidate.price_level,
          website_url: null,
          website_status: candidate.website_presence === "unknown" ? "unknown" : "no_website" as const,
          google_maps_url: candidate.google_maps_url,
          already_in_crm: Boolean(existingLead),
          existing_lead_id: existingLead?.id ?? null,
          matched_subtype: candidate.subtype_match_reason,
          region_match: true,
        } satisfies Database["public"]["Tables"]["discovery_job_results"]["Insert"];
      });

    const debugSummary = createDebugSummary(input, region, {
      totalTiles: tiles.length,
      rawCandidates: rawCandidates.length,
      uniqueCandidates: uniqueCandidates.length,
      droppedForWebsite,
      droppedForLowReviews,
      droppedForSubtype,
      passedReviewFilter: reviewAndSubtypeCandidates.length,
      passedNoWebsiteFilter: websiteCheckedCandidates.length,
      finalSavedCandidates: finalResults.length,
      safetyCapHit,
    });

    await updateJob(jobId, {
      current_phase: "Finalizing prospects",
      candidates_passing_review_filter: reviewAndSubtypeCandidates.length,
      candidates_passing_no_website_filter: websiteCheckedCandidates.length,
      candidates_dropped_low_reviews: droppedForLowReviews,
      candidates_dropped_has_website: droppedForWebsite,
      candidates_dropped_subtype: droppedForSubtype,
      no_website_places_found: finalResults.length,
      debug_summary: debugSummary as unknown as Database["public"]["Tables"]["discovery_jobs"]["Update"]["debug_summary"],
    });

    await supabase.from("discovery_job_results").delete().eq("discovery_job_id", jobId);

    if (finalResults.length > 0) {
      const { error: insertError } = await supabase.from("discovery_job_results").insert(finalResults);
      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    await updateJob(jobId, {
      status: "completed",
      current_phase: safetyCapHit ? "Completed with safety caps" : "Completed",
      raw_places_found: rawCandidates.length,
      unique_places_found: uniqueCandidates.length,
      no_website_places_found: finalResults.length,
      finished_at: new Date().toISOString(),
      completed_tiles: tiles.length,
      debug_summary: debugSummary as unknown as Database["public"]["Tables"]["discovery_jobs"]["Update"]["debug_summary"],
    });
  } catch (error) {
    await updateJob(jobId, {
      status: "failed",
      current_phase: "Failed",
      error_message: error instanceof Error ? error.message : "Discovery job failed.",
      finished_at: new Date().toISOString(),
    });
  }
}
