const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const optionalServerEnv = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const optionalPublicEnv = {
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
};

export function hasSupabaseEnv() {
  return Boolean(
    requiredEnv.NEXT_PUBLIC_SUPABASE_URL && requiredEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getMissingEnvVars() {
  return Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function getEnv() {
  const missing = getMissingEnvVars();

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    supabaseUrl: requiredEnv.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: requiredEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

export function hasGoogleMapsEnv() {
  return Boolean(optionalServerEnv.GOOGLE_MAPS_API_KEY);
}

export function getGoogleMapsApiKey() {
  if (!optionalServerEnv.GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing required environment variable: GOOGLE_MAPS_API_KEY");
  }

  return optionalServerEnv.GOOGLE_MAPS_API_KEY;
}

export function hasSupabaseServiceRoleEnv() {
  return Boolean(optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseServiceRoleKey() {
  if (!optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasGoogleMapsBrowserEnv() {
  return Boolean(
    optionalPublicEnv.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY &&
      optionalPublicEnv.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
  );
}

export function getGoogleMapsBrowserEnv() {
  if (!optionalPublicEnv.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY");
  }

  if (!optionalPublicEnv.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID");
  }

  return {
    browserKey: optionalPublicEnv.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
    mapId: optionalPublicEnv.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
  };
}
