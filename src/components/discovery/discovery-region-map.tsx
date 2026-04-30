"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { loadGoogleMapsBrowserApi } from "@/lib/google-maps/browser";
import type { DiscoveryResultItem } from "@/lib/data/discovery-jobs";
import type { DiscoveryLatLng, DiscoveryRegionData } from "@/lib/discovery/types";

type MapsEventListener = {
  remove?: () => void;
};

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleMapMouseEvent = {
  latLng?: GoogleLatLng;
};

type GoogleLatLngBounds = {
  extend: (latLng: { lat: number; lng: number }) => void;
};

type GoogleMap = {
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
  panTo: (latLng: { lat: number; lng: number }) => void;
  getCenter: () => GoogleLatLng | null;
  setCenter: (latLng: { lat: number; lng: number }) => void;
  setOptions: (options: Record<string, unknown>) => void;
  addListener: (
    eventName: string,
    handler: (...args: unknown[]) => void,
  ) => MapsEventListener | void;
};

type RectangleOverlay = {
  setMap: (map: unknown | null) => void;
  setBounds?: (bounds: Record<string, number>) => void;
};

type CircleOverlay = {
  setMap: (map: unknown | null) => void;
};

type BasicMarker = {
  map: unknown | null;
  setMap?: (map: unknown | null) => void;
};

type InfoWindow = {
  setContent: (content: string) => void;
  open: (options: Record<string, unknown>) => void;
  close?: () => void;
};

type AdvancedMarkerElement = {
  map: unknown | null;
  content?: HTMLElement;
  position?: { lat: number; lng: number };
  addListener: (eventName: string, handler: () => void) => MapsEventListener | void;
};

type GoogleMapsNamespace = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
  Rectangle: new (options: Record<string, unknown>) => RectangleOverlay;
  Circle: new (options: Record<string, unknown>) => CircleOverlay;
  Marker: new (options: Record<string, unknown>) => BasicMarker;
  InfoWindow: new () => InfoWindow;
  LatLngBounds: new () => GoogleLatLngBounds;
  marker?: {
    AdvancedMarkerElement?: new (options: Record<string, unknown>) => AdvancedMarkerElement;
  };
};

type BrowserWindow = Window & {
  google?: {
    maps?: GoogleMapsNamespace;
  };
};

const DEFAULT_CENTER = { lat: 40.6782, lng: -73.9442 };

function getRegionCenter(region: DiscoveryRegionData) {
  if (region.type === "circle") {
    return {
      lat: region.center.latitude,
      lng: region.center.longitude,
    };
  }

  return {
    lat: (region.bounds.north + region.bounds.south) / 2,
    lng: (region.bounds.east + region.bounds.west) / 2,
  };
}

function buildRectangleBounds(start: DiscoveryLatLng, end: DiscoveryLatLng) {
  return {
    north: Math.max(start.latitude, end.latitude),
    south: Math.min(start.latitude, end.latitude),
    east: Math.max(start.longitude, end.longitude),
    west: Math.min(start.longitude, end.longitude),
  };
}

function rectangleFromBounds(bounds: ReturnType<typeof buildRectangleBounds>): DiscoveryRegionData {
  return {
    type: "rectangle",
    label: "Custom drawn rectangle",
    bounds,
    center: {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2,
    },
  };
}

function buildMarkerContent(input: {
  label: string;
  selected: boolean;
  hovered: boolean;
  existingInCrm: boolean;
}) {
  const element = document.createElement("div");
  const background = input.selected
    ? "#111827"
    : input.hovered
      ? "#1f2937"
      : input.existingInCrm
        ? "#e5e7eb"
        : "#ffffff";
  const color = input.selected || input.hovered ? "#ffffff" : input.existingInCrm ? "#4b5563" : "#111827";
  const border = input.selected || input.hovered ? "#111827" : input.existingInCrm ? "#d1d5db" : "#111827";

  element.style.width = "28px";
  element.style.height = "28px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.borderRadius = "999px";
  element.style.background = background;
  element.style.color = color;
  element.style.border = `1px solid ${border}`;
  element.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.14)";
  element.style.fontSize = "11px";
  element.style.fontWeight = "600";
  element.textContent = input.label;
  return element;
}

function buildInfoContent(result: DiscoveryResultItem) {
  return `<div style="padding:4px 2px;max-width:220px"><div style="font-weight:600;color:#111827">${result.name}</div><div style="font-size:12px;color:#6b7280;margin-top:4px">${result.formatted_address ?? "Address not returned"}</div></div>`;
}

export function DiscoveryRegionMap({
  mapEnabled,
  regionData,
  isRectangleDrawing,
  circleRadiusMeters,
  results,
  focusedResultId,
  hoveredResultId,
  onRegionChange,
  onRectangleDrawingChange,
  onSelectResult,
}: {
  mapEnabled: boolean;
  regionData: DiscoveryRegionData | null;
  isRectangleDrawing: boolean;
  circleRadiusMeters: number;
  results: DiscoveryResultItem[];
  focusedResultId: string | null;
  hoveredResultId: string | null;
  onRegionChange: (region: DiscoveryRegionData | null) => void;
  onRectangleDrawingChange: (active: boolean) => void;
  onSelectResult: (resultId: string | null) => void;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
  const infoWindowRef = useRef<InfoWindow | null>(null);
  const regionOverlayRef = useRef<RectangleOverlay | CircleOverlay | null>(null);
  const drawingOverlayRef = useRef<RectangleOverlay | null>(null);
  const centerMarkerRef = useRef<BasicMarker | null>(null);
  const resultMarkersRef = useRef<Map<string, AdvancedMarkerElement>>(new Map());
  const drawingStartRef = useRef<DiscoveryLatLng | null>(null);
  const interactionListenersRef = useRef<MapsEventListener[]>([]);
  const hasUserAdjustedRef = useRef(false);
  const lastFitSignatureRef = useRef<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resultsWithLocation = useMemo(
    () =>
      results.filter(
        (result): result is DiscoveryResultItem & { location: { latitude: number; longitude: number } } =>
          Boolean(result.location),
      ),
    [results],
  );

  useEffect(() => {
    if (!mapEnabled || !mapElementRef.current) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const markerStore = resultMarkersRef.current;

    const init = async () => {
      try {
        await loadGoogleMapsBrowserApi();
        const googleMaps = (window as BrowserWindow).google?.maps ?? null;
        if (!googleMaps?.Map || !googleMaps.InfoWindow || !googleMaps.LatLngBounds) {
          throw new Error("Google Maps failed to initialize.");
        }

        googleMapsRef.current = googleMaps;

        if (cancelled || !mapElementRef.current) {
          return;
        }

        const map = new googleMaps.Map(mapElementRef.current, {
          center: regionData ? getRegionCenter(regionData) : DEFAULT_CENTER,
          zoom: 12,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });

        mapRef.current = map;
        infoWindowRef.current = new googleMaps.InfoWindow();

        const dragListener = map.addListener("dragstart", () => {
          hasUserAdjustedRef.current = true;
        });
        const zoomListener = map.addListener("zoom_changed", () => {
          hasUserAdjustedRef.current = true;
        });

        interactionListenersRef.current = [dragListener, zoomListener].filter(Boolean) as MapsEventListener[];
        setIsLoading(false);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Map failed to load.");
        setIsLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
      interactionListenersRef.current.forEach((listener) => listener.remove?.());
      regionOverlayRef.current?.setMap(null);
      drawingOverlayRef.current?.setMap(null);
      centerMarkerRef.current?.setMap?.(null);
      markerStore.forEach((marker) => {
        marker.map = null;
      });
      markerStore.clear();
    };
  }, [mapEnabled, regionData]);

  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = googleMapsRef.current;
    if (!map || !googleMaps) {
      return;
    }

    map.setOptions({
      draggableCursor: isRectangleDrawing ? "crosshair" : undefined,
    });

    if (!isRectangleDrawing) {
      drawingStartRef.current = null;
      drawingOverlayRef.current?.setMap(null);
      drawingOverlayRef.current = null;
      map.setOptions({ draggable: true });
      return;
    }

    map.setOptions({ draggable: false });

    const mouseDownListener = map.addListener("mousedown", (...args: unknown[]) => {
      const [event] = args as [GoogleMapMouseEvent?];
      const latitude = event?.latLng?.lat?.();
      const longitude = event?.latLng?.lng?.();
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return;
      }

      drawingStartRef.current = { latitude, longitude };

      if (!drawingOverlayRef.current) {
        drawingOverlayRef.current = new googleMaps.Rectangle({
          map,
          bounds: buildRectangleBounds(drawingStartRef.current, drawingStartRef.current),
          strokeColor: "#111827",
          strokeOpacity: 0.9,
          strokeWeight: 1.5,
          fillColor: "#111827",
          fillOpacity: 0.08,
        });
      }
    });

    const mouseMoveListener = map.addListener("mousemove", (...args: unknown[]) => {
      if (!drawingStartRef.current || !drawingOverlayRef.current?.setBounds) {
        return;
      }

      const [event] = args as [GoogleMapMouseEvent?];
      const latitude = event?.latLng?.lat?.();
      const longitude = event?.latLng?.lng?.();
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return;
      }

      drawingOverlayRef.current.setBounds(
        buildRectangleBounds(drawingStartRef.current, { latitude, longitude }),
      );
    });

    const mouseUpListener = map.addListener("mouseup", (...args: unknown[]) => {
      if (!drawingStartRef.current) {
        return;
      }

      const [event] = args as [GoogleMapMouseEvent?];
      const latitude = event?.latLng?.lat?.();
      const longitude = event?.latLng?.lng?.();
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return;
      }

      const bounds = buildRectangleBounds(drawingStartRef.current, { latitude, longitude });
      drawingStartRef.current = null;
      drawingOverlayRef.current?.setMap(null);
      drawingOverlayRef.current = null;
      map.setOptions({ draggable: true });
      onRegionChange(rectangleFromBounds(bounds));
      onRectangleDrawingChange(false);
      hasUserAdjustedRef.current = false;
    });

    return () => {
      mouseDownListener?.remove?.();
      mouseMoveListener?.remove?.();
      mouseUpListener?.remove?.();
    };
  }, [isRectangleDrawing, onRectangleDrawingChange, onRegionChange]);

  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = googleMapsRef.current;
    if (!map || !googleMaps) {
      return;
    }

    regionOverlayRef.current?.setMap(null);
    centerMarkerRef.current?.setMap?.(null);
    regionOverlayRef.current = null;
    centerMarkerRef.current = null;

    if (!regionData) {
      return;
    }

    if (regionData.type === "circle") {
      regionOverlayRef.current = new googleMaps.Circle({
        map,
        center: {
          lat: regionData.center.latitude,
          lng: regionData.center.longitude,
        },
        radius: circleRadiusMeters || regionData.radiusMeters,
        strokeColor: "#111827",
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        fillColor: "#111827",
        fillOpacity: 0.06,
      });

      centerMarkerRef.current = new googleMaps.Marker({
        map,
        position: {
          lat: regionData.center.latitude,
          lng: regionData.center.longitude,
        },
      });
    } else {
      regionOverlayRef.current = new googleMaps.Rectangle({
        map,
        bounds: {
          north: regionData.bounds.north,
          south: regionData.bounds.south,
          east: regionData.bounds.east,
          west: regionData.bounds.west,
        },
        strokeColor: "#111827",
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        fillColor: "#111827",
        fillOpacity: 0.06,
      });
    }
  }, [circleRadiusMeters, regionData]);

  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = googleMapsRef.current;
    if (!map || !googleMaps?.marker?.AdvancedMarkerElement) {
      return;
    }

    const AdvancedMarker = googleMaps.marker.AdvancedMarkerElement;
    const infoWindow = infoWindowRef.current;
    const nextIds = new Set(resultsWithLocation.map((result) => result.result_id));

    resultMarkersRef.current.forEach((marker, resultId) => {
      if (!nextIds.has(resultId)) {
        marker.map = null;
        resultMarkersRef.current.delete(resultId);
      }
    });

    for (const [index, result] of resultsWithLocation.entries()) {
      const existing = resultMarkersRef.current.get(result.result_id);
      const content = buildMarkerContent({
        label: String(index + 1),
        selected: result.result_id === focusedResultId,
        hovered: result.result_id === hoveredResultId,
        existingInCrm: Boolean(result.existing_lead),
      });

      if (existing) {
        existing.content = content;
        existing.position = {
          lat: result.location.latitude,
          lng: result.location.longitude,
        };
        continue;
      }

      const marker = new AdvancedMarker({
        map,
        position: {
          lat: result.location.latitude,
          lng: result.location.longitude,
        },
        content,
      });

      marker.addListener("click", () => {
        onSelectResult(result.result_id);
        infoWindow?.setContent(buildInfoContent(result));
        infoWindow?.open({ map, anchor: marker });
      });

      resultMarkersRef.current.set(result.result_id, marker);
    }
  }, [focusedResultId, hoveredResultId, onSelectResult, resultsWithLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedResultId) {
      return;
    }

    const focused = resultsWithLocation.find((result) => result.result_id === focusedResultId);
    if (!focused) {
      return;
    }

    map.panTo({
      lat: focused.location.latitude,
      lng: focused.location.longitude,
    });
  }, [focusedResultId, resultsWithLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = googleMapsRef.current;
    if (!map || !googleMaps?.LatLngBounds) {
      return;
    }

    const fitSignature = JSON.stringify({
      region: regionData,
      results: resultsWithLocation.map((result) => result.result_id),
    });

    if (fitSignature !== lastFitSignatureRef.current) {
      hasUserAdjustedRef.current = false;
      lastFitSignatureRef.current = fitSignature;
    }

    if (hasUserAdjustedRef.current) {
      return;
    }

    if (!regionData && resultsWithLocation.length === 0) {
      return;
    }

    const bounds = new googleMaps.LatLngBounds();

    if (regionData?.type === "circle") {
      bounds.extend({
        lat: regionData.center.latitude,
        lng: regionData.center.longitude,
      });
      bounds.extend({
        lat: regionData.center.latitude + regionData.radiusMeters / 111_320,
        lng: regionData.center.longitude + regionData.radiusMeters / 111_320,
      });
      bounds.extend({
        lat: regionData.center.latitude - regionData.radiusMeters / 111_320,
        lng: regionData.center.longitude - regionData.radiusMeters / 111_320,
      });
    } else if (regionData) {
      bounds.extend({ lat: regionData.bounds.north, lng: regionData.bounds.east });
      bounds.extend({ lat: regionData.bounds.south, lng: regionData.bounds.west });
    }

    resultsWithLocation.forEach((result) => {
      bounds.extend({
        lat: result.location.latitude,
        lng: result.location.longitude,
      });
    });

    map.fitBounds(bounds, 48);
  }, [regionData, resultsWithLocation]);

  const summary = useMemo(() => {
    if (!regionData) {
      return "Draw a rectangle to define the exact search region.";
    }

    if (regionData.type === "circle") {
      return `${Math.round(circleRadiusMeters || regionData.radiusMeters)}m exact radius`;
    }

    return "Exact rectangle region selected";
  }, [circleRadiusMeters, regionData]);

  return (
    <section className="space-y-3 border border-[#e6e8ec] bg-white p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#eceff3] pb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Map workspace</p>
          <p className="mt-1 text-sm text-neutral-600">{summary}</p>
        </div>
        {results.length > 0 ? (
          <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            {results.length} final prospects on map
          </p>
        ) : null}
      </div>

      <div className="relative h-[360px] overflow-hidden border border-[#e6e8ec] bg-[#f8fafc] lg:h-[520px]">
        {mapEnabled ? <div ref={mapElementRef} className="h-full w-full" /> : null}
        {!mapEnabled ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-neutral-500">
            Configure the browser Google Maps key and Map ID to use Discovery drawing and result markers.
          </div>
        ) : null}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/92 text-sm text-neutral-600">
            <LoaderCircle className="size-4 animate-spin" />
            Loading discovery map
          </div>
        ) : null}
        {loadError ? (
          <div className="absolute inset-x-4 top-4 border border-[#e6e8ec] bg-white px-4 py-3 text-sm text-neutral-700">
            {loadError}
          </div>
        ) : null}
        {isRectangleDrawing ? (
          <div className="pointer-events-none absolute left-4 top-4 border border-[#111827] bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm">
            Click and drag to draw the exact search rectangle
          </div>
        ) : null}
      </div>
    </section>
  );
}
