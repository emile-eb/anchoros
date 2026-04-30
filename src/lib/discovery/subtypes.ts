import { startCase } from "@/lib/formatters";
import type { DiscoverySubtypeMode } from "@/lib/discovery/types";

type DiscoverySubtypeDefinition = {
  aliases: string[];
  strictPrimaryTypes: string[];
  broadKeywords: string[];
  label: string;
};

const DISCOVERY_SUBTYPE_DEFINITIONS: DiscoverySubtypeDefinition[] = [
  { aliases: ["pizza", "pizzeria"], strictPrimaryTypes: ["pizza_restaurant"], broadKeywords: ["pizza", "pizzeria"], label: "Pizza" },
  { aliases: ["coffee", "coffee shop"], strictPrimaryTypes: ["coffee_shop"], broadKeywords: ["coffee", "espresso"], label: "Coffee" },
  { aliases: ["cafe", "cafes"], strictPrimaryTypes: ["cafe"], broadKeywords: ["cafe", "cafes"], label: "Cafe" },
  { aliases: ["bakery", "bakeries"], strictPrimaryTypes: ["bakery"], broadKeywords: ["bakery", "baked"], label: "Bakery" },
  { aliases: ["bar", "bars"], strictPrimaryTypes: ["bar"], broadKeywords: ["bar", "cocktail"], label: "Bar" },
  { aliases: ["ramen"], strictPrimaryTypes: [], broadKeywords: ["ramen"], label: "Ramen" },
  { aliases: ["hot pot", "hotpot"], strictPrimaryTypes: [], broadKeywords: ["hot pot", "hotpot"], label: "Hot Pot" },
  { aliases: ["halal"], strictPrimaryTypes: [], broadKeywords: ["halal"], label: "Halal" },
  { aliases: ["kosher"], strictPrimaryTypes: [], broadKeywords: ["kosher"], label: "Kosher" },
  { aliases: ["mexican"], strictPrimaryTypes: [], broadKeywords: ["mexican"], label: "Mexican" },
  { aliases: ["chinese"], strictPrimaryTypes: [], broadKeywords: ["chinese"], label: "Chinese" },
];

function normalizeSubtype(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function resolveDiscoverySubtype(subtype: string | null | undefined) {
  const normalized = normalizeSubtype(subtype);
  if (!normalized) {
    return null;
  }

  return (
    DISCOVERY_SUBTYPE_DEFINITIONS.find((definition) =>
      definition.aliases.some((alias) => normalized === alias),
    ) ?? {
      aliases: [normalized],
      strictPrimaryTypes: [],
      broadKeywords: normalized.split(/\s+/),
      label: startCase(normalized),
    }
  );
}

export function getStrictDiscoveryTypes(subtype: string | null | undefined) {
  return resolveDiscoverySubtype(subtype)?.strictPrimaryTypes ?? [];
}

export function scoreSubtypeMatch(
  value: {
    primaryType?: string | null;
    primaryTypeLabel?: string | null;
    name?: string | null;
    types?: string[] | null;
  },
  subtype: string | null | undefined,
  mode: DiscoverySubtypeMode,
) {
  const resolved = resolveDiscoverySubtype(subtype);
  if (!resolved) {
    return { score: 0, reason: null as string | null, passesStrict: true };
  }

  const haystack = [
    value.primaryType ?? "",
    value.primaryTypeLabel ?? "",
    value.name ?? "",
    ...(value.types ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const strictHit = resolved.strictPrimaryTypes.some(
    (strictType) =>
      strictType === value.primaryType || (value.types ?? []).includes(strictType),
  );

  const keywordHits = resolved.broadKeywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));

  if (mode === "strict") {
    const passesStrict = strictHit || keywordHits.length > 0;
    return {
      score: strictHit ? 3 : keywordHits.length > 0 ? 1 : -10,
      reason: passesStrict ? `Strict subtype: ${resolved.label}` : null,
      passesStrict,
    };
  }

  return {
    score: strictHit ? 3 : keywordHits.length > 0 ? Math.min(2, keywordHits.length) : 0,
    reason: keywordHits.length > 0 || strictHit ? `Subtype match: ${resolved.label}` : null,
    passesStrict: true,
  };
}
