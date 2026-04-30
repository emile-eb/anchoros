"use client";

import { useEffect, useRef, useState } from "react";
import { Map } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteMapData, RouteStopDetail } from "@/lib/data/routes";
import { loadGoogleMapsBrowserApi, type BrowserGoogleMaps } from "@/lib/google-maps/browser";

type GoogleMapInstance = {
  panTo: (latLng: { lat: number; lng: number }) => void;
  fitBounds: (bounds: unknown, padding?: number) => void;
};

type GoogleMapConstructor = new (
  element: HTMLElement,
  options: Record<string, unknown>,
) => GoogleMapInstance;

type GoogleInfoWindowInstance = {
  setContent: (content: string) => void;
  open: (options: Record<string, unknown>) => void;
};

type GoogleInfoWindowConstructor = new () => GoogleInfoWindowInstance;

type GoogleLatLngBoundsInstance = {
  extend: (latLng: { lat: number; lng: number }) => void;
};

type GoogleLatLngBoundsConstructor = new () => GoogleLatLngBoundsInstance;

type GoogleMarkerInstance = {
  map: unknown;
  addListener: (eventName: string, handler: () => void) => void;
};

type GoogleMarkerConstructor = new (options: Record<string, unknown>) => GoogleMarkerInstance;

type GooglePolylineInstance = {
  setMap: (map: unknown | null) => void;
};

type GooglePolylineConstructor = new (options: Record<string, unknown>) => GooglePolylineInstance;
type GoogleMarkerNamespace = {
  AdvancedMarkerElement?: GoogleMarkerConstructor;
};

type BrowserWindow = Window & {
  google?: {
    maps?: BrowserGoogleMaps & {
      marker?: GoogleMarkerNamespace;
    };
  };
};

function getStopColor(status: RouteStopDetail["status"], selected: boolean) {
  if (selected) return { background: "#111111", color: "#ffffff", border: "#111111" };
  if (status === "active") return { background: "#111111", color: "#ffffff", border: "#111111" };
  if (status === "completed" || status === "visited") return { background: "#0f766e", color: "#ffffff", border: "#0f766e" };
  if (status === "skipped") return { background: "#f5f5f5", color: "#737373", border: "#d4d4d4" };
  if (status === "revisit_needed") return { background: "#1d4ed8", color: "#ffffff", border: "#1d4ed8" };
  return { background: "#ffffff", color: "#171717", border: "#d4d4d4" };
}

function buildMarkerContent(label: string, color: { background: string; color: string; border: string }) {
  const element = document.createElement("div");
  element.style.width = "38px";
  element.style.height = "38px";
  element.style.borderRadius = "999px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.fontSize = "13px";
  element.style.fontWeight = "700";
  element.style.background = color.background;
  element.style.color = color.color;
  element.style.border = `1px solid ${color.border}`;
  element.style.boxShadow = "0 10px 24px rgba(10,10,10,0.12)";
  element.textContent = label;
  return element;
}

export function RouteMap({
  mapData,
  stops,
  selectedStopId,
  onSelectStop,
}: {
  mapData: RouteMapData | null;
  stops: RouteStopDetail[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<GoogleMapInstance | null>(null);
  const markerRefs = useRef<GoogleMarkerInstance[]>([]);
  const polylineRefs = useRef<GooglePolylineInstance[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || !mapData) {
        setIsLoading(false);
        return;
      }

      try {
        await loadGoogleMapsBrowserApi();
        const googleMaps = (window as BrowserWindow).google?.maps;
        if (
          !googleMaps?.Map ||
          !googleMaps.InfoWindow ||
          !googleMaps.LatLngBounds ||
          !googleMaps.Polyline ||
          !googleMaps.marker?.AdvancedMarkerElement
        ) {
          throw new Error("Google Maps core constructors are not available.");
        }

        const GoogleMap = googleMaps.Map as GoogleMapConstructor;
        const InfoWindow = googleMaps.InfoWindow as GoogleInfoWindowConstructor;
        const LatLngBounds = googleMaps.LatLngBounds as GoogleLatLngBoundsConstructor;
        const Polyline = googleMaps.Polyline as GooglePolylineConstructor;
        const AdvancedMarkerElement = googleMaps.marker.AdvancedMarkerElement as GoogleMarkerConstructor;

        if (cancelled || !mapRef.current) {
          return;
        }

        const map = new GoogleMap(mapRef.current, {
          center: { lat: mapData.origin.latitude, lng: mapData.origin.longitude },
          zoom: 13,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });

        googleMapRef.current = map;

        const bounds = new LatLngBounds();
        bounds.extend({ lat: mapData.origin.latitude, lng: mapData.origin.longitude });
        bounds.extend({ lat: mapData.destination.latitude, lng: mapData.destination.longitude });

        polylineRefs.current = mapData.segments.map((segment) => {
          segment.path.forEach((point) => bounds.extend({ lat: point.latitude, lng: point.longitude }));
          const polyline = new Polyline({
            path: segment.path.map((point) => ({ lat: point.latitude, lng: point.longitude })),
            strokeColor: "#111111",
            strokeOpacity: 0.7,
            strokeWeight: 4,
            map,
          });
          return polyline;
        });

        const infoWindow = new InfoWindow();

        const startMarker = new AdvancedMarkerElement({
          map,
          position: { lat: mapData.origin.latitude, lng: mapData.origin.longitude },
          content: buildMarkerContent("S", { background: "#ffffff", color: "#171717", border: "#111111" }),
        });

        const endMarker = new AdvancedMarkerElement({
          map,
          position: { lat: mapData.destination.latitude, lng: mapData.destination.longitude },
          content: buildMarkerContent("E", { background: "#171717", color: "#ffffff", border: "#171717" }),
        });

        markerRefs.current = [
          startMarker,
          endMarker,
          ...stops
            .filter(
              (stop): stop is RouteStopDetail & { latitude: number; longitude: number } =>
                typeof stop.latitude === "number" && typeof stop.longitude === "number",
            )
            .map((stop) => {
              const marker = new AdvancedMarkerElement({
                map,
                position: { lat: stop.latitude, lng: stop.longitude },
                content: buildMarkerContent(
                  String(stop.stop_order),
                  getStopColor(stop.status, stop.id === selectedStopId),
                ),
              });

              marker.addListener("click", () => {
                onSelectStop(stop.id);
                infoWindow.setContent(
                  `<div style="padding:4px 2px"><div style="font-weight:600">${stop.restaurant_name ?? "Stop"}</div><div style="font-size:12px;color:#737373">${stop.formatted_address ?? ""}</div></div>`,
                );
                infoWindow.open({ map, anchor: marker });
              });

              return marker;
            }),
        ];

        map.fitBounds(bounds, 56);
        setIsLoading(false);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Map failed to load.");
        setIsLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => {
        if (marker) marker.map = null;
      });
      polylineRefs.current.forEach((polyline) => {
        if (polyline) polyline.setMap(null);
      });
    };
  }, [mapData, onSelectStop, selectedStopId, stops]);

  useEffect(() => {
    if (!googleMapRef.current || !selectedStopId) {
      return;
    }

    const selected = stops.find((stop) => stop.id === selectedStopId);
    if (!selected || typeof selected.latitude !== "number" || typeof selected.longitude !== "number") {
      return;
    }

    googleMapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude });
  }, [selectedStopId, stops]);

  if (!mapData) {
    return (
      <div className="flex h-[240px] items-center justify-center border border-[#eceff3] bg-[#f8fafc] text-sm text-neutral-500 lg:h-[420px]">
        Route geometry is not available yet for this route.
      </div>
    );
  }

  return (
    <div className="relative h-[240px] overflow-hidden border border-[#eceff3] bg-[#f8fafc] md:h-[420px] lg:h-[620px]">
      <div ref={mapRef} className="h-full w-full" />
      {isLoading ? (
        <div className="absolute inset-0 space-y-4 bg-white/90 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-neutral-700">
            <div className="border border-[#e5e7eb] bg-white p-3">
              <Map className="size-5" />
            </div>
            <div>
              <p className="font-medium">Loading route map</p>
              <p className="text-sm text-neutral-500">Drawing segments and syncing stop markers.</p>
            </div>
          </div>
          <Skeleton className="h-[320px] w-full rounded-md" />
        </div>
      ) : null}
      {loadError ? (
        <div className="absolute inset-x-4 top-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      ) : null}
    </div>
  );
}
