/**
 * Core domain types for ISSCOPE.
 * Keeping these separate from UI/lib code makes the data contracts explicit
 * and lets components and calculation logic evolve independently.
 */

/** A raw two-line element set, as published by CelesTrak / Space-Track. */
export interface TLE {
  name: string;
  line1: string;
  line2: string;
  /** When we fetched/parsed this TLE (client clock, ISO string). */
  fetchedAt: string;
  /** Epoch encoded inside line1, decoded to a real Date for freshness checks. */
  epoch: string;
}

/** Observer location, always handled client-side only (see lib/location.ts). */
export interface ObserverLocation {
  label: string;
  latitude: number;
  longitude: number;
  /** Meters above sea level. Defaults to 0 if unknown. */
  altitude: number;
  source: "geolocation" | "manual" | "default";
}

/** Instantaneous geometry of the ISS as seen from the observer. */
export interface LookAngles {
  azimuthDeg: number; // 0-360, 0 = North, clockwise
  elevationDeg: number; // -90 to 90, >0 = above horizon
  rangeKm: number;
}

/** ISS position in geographic + orbital terms at a given instant. */
export interface ISSPosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmS: number;
  timestamp: string; // ISO
}

/** Visibility classification for a given elevation, used for UI treatment. */
export type VisibilityTier = "below-horizon" | "marginal" | "good" | "excellent";

/** One sample point along a pass, used to draw the sky-track. */
export interface PassPoint {
  timestamp: string;
  azimuthDeg: number;
  elevationDeg: number;
  illuminated: boolean;
}

/** A single, fully-resolved visible pass of the ISS over the observer. */
export interface ISSPass {
  id: string;
  startTime: string; // ISO, local-relevant but stored UTC
  endTime: string;
  maxTime: string;
  startAzimuthDeg: number;
  maxAzimuthDeg: number;
  endAzimuthDeg: number;
  maxElevationDeg: number;
  durationSeconds: number;
  magnitude: number | null; // reserved for future brightness modeling
  track: PassPoint[];
  visibilityTier: VisibilityTier;
}

/** Sun geometry needed for day/night + illumination reasoning. */
export interface SunGeometry {
  sunAltitudeDeg: number; // observer's local sun altitude
  issIlluminated: boolean; // true if ISS is outside Earth's shadow
}

export type ConnectionState = "idle" | "loading" | "ready" | "stale" | "error";

export interface AppError {
  code:
    | "GEOLOCATION_DENIED"
    | "GEOLOCATION_UNSUPPORTED"
    | "TLE_FETCH_FAILED"
    | "TLE_STALE"
    | "OFFLINE"
    | "NOTIFICATION_DENIED"
    | "UNKNOWN";
  message: string;
}
