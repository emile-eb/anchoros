type BrowserGoogleMaps = {
  Map?: unknown;
  InfoWindow?: unknown;
  LatLngBounds?: unknown;
  Polyline?: unknown;
  marker?: {
    AdvancedMarkerElement?: unknown;
  };
};

type BrowserWindow = Window & {
  google?: {
    maps?: BrowserGoogleMaps;
  };
};

let googleMapsPromise: Promise<BrowserGoogleMaps> | null = null;

async function waitForGoogleMaps() {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    const loaded = (window as BrowserWindow).google;
    if (loaded?.maps?.Map) {
      return loaded.maps;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  throw new Error("Google Maps failed to initialize.");
}

export async function loadGoogleMapsBrowserApi() {
  if (typeof window === "undefined") {
    throw new Error("Google Maps browser API can only load in the browser.");
  }

  const existing = (window as BrowserWindow).google;
  if (existing?.maps?.Map) {
    return existing.maps;
  }

  const browserKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  if (!browserKey) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.");
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${browserKey}&v=weekly&libraries=marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        void waitForGoogleMaps().then(resolve).catch(reject);
      };
      script.onerror = () => reject(new Error("Google Maps script failed to load."));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

export type { BrowserGoogleMaps };
