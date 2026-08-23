/**
 * Observer location handling. Everything here stays client-side —
 * coordinates are never sent to a server (see README "Privacy").
 */
import type { AppError, ObserverLocation } from "@/types/iss";

const STORAGE_KEY = "isscope.observer-location.v1";

export const DEFAULT_LOCATION: ObserverLocation = {
  label: "Tokyo, Japan",
  latitude: 35.6762,
  longitude: 139.6503,
  altitude: 40,
  source: "default",
};

export function loadSavedLocation(): ObserverLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ObserverLocation;
  } catch {
    return null;
  }
}

export function saveLocation(location: ObserverLocation): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export function requestBrowserLocation(): Promise<
  { ok: true; location: ObserverLocation } | { ok: false; error: AppError }
> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({
        ok: false,
        error: {
          code: "GEOLOCATION_UNSUPPORTED",
          message: "This browser does not support geolocation.",
        },
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location: ObserverLocation = {
          label: "Current location",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude ?? 0,
          source: "geolocation",
        };
        saveLocation(location);
        resolve({ ok: true, location });
      },
      () => {
        resolve({
          ok: false,
          error: {
            code: "GEOLOCATION_DENIED",
            message: "Location permission was denied.",
          },
        });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    );
  });
}

/** Very small city lookup for the manual fallback UI (extend as needed). */
export const CITY_PRESETS: ObserverLocation[] = [
  { label: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503, altitude: 40, source: "manual" },
  { label: "Osaka, Japan", latitude: 34.6937, longitude: 135.5023, altitude: 15, source: "manual" },
  { label: "New York, USA", latitude: 40.7128, longitude: -74.006, altitude: 10, source: "manual" },
  { label: "London, UK", latitude: 51.5072, longitude: -0.1276, altitude: 11, source: "manual" },
  { label: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093, altitude: 19, source: "manual" },
  { label: "São Paulo, Brazil", latitude: -23.5505, longitude: -46.6333, altitude: 760, source: "manual" },
];
