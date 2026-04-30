export function startCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPriceRange({
  exact,
  low,
  high,
}: {
  exact?: number | null;
  low?: number | null;
  high?: number | null;
}) {
  if (exact != null) {
    return formatCurrency(exact);
  }

  if (low != null && high != null) {
    return `${formatCurrency(low)} - ${formatCurrency(high)}`;
  }

  if (low != null) {
    return `${formatCurrency(low)}+`;
  }

  if (high != null) {
    return `Up to ${formatCurrency(high)}`;
  }

  return "Not set";
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function isFollowUpDue(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() <= Date.now();
}

export function formatDistanceMeters(value: number | null | undefined) {
  if (value == null) {
    return "Not set";
  }

  const miles = value / 1609.34;
  return `${miles.toFixed(miles >= 10 ? 0 : 1)} mi`;
}

export function formatDurationMinutes(value: number | null | undefined) {
  if (value == null) {
    return "Not set";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function inferBoroughFromAddress(address: string | null | undefined) {
  if (!address) {
    return null;
  }

  const normalized = address.toLowerCase();

  if (normalized.includes("brooklyn") || normalized.includes("kings county")) {
    return "Brooklyn";
  }

  if (normalized.includes("queens")) {
    return "Queens";
  }

  if (normalized.includes("bronx")) {
    return "Bronx";
  }

  if (normalized.includes("staten island") || normalized.includes("richmond county")) {
    return "Staten Island";
  }

  if (
    normalized.includes("manhattan") ||
    normalized.includes("new york, ny") ||
    normalized.includes("new york county")
  ) {
    return "Manhattan";
  }

  return null;
}
