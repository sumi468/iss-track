/**
 * Thin, typed wrapper around satellite.js (SGP4/SDP4 propagator).
 * All orbital mechanics for the app flows through this module so that
 * UI components never touch satellite.js directly.
 */
import * as satellite from "satellite.js";
import type { ISSPosition, LookAngles, ObserverLocation, TLE } from "@/types/iss";

export interface SatRec {
  raw: satellite.SatRec;
  tle: TLE;
}

/** Parse a TLE's line1 epoch field into a real Date (UTC). */
function parseEpoch(line1: string): string {
  // Columns 19-20 = 2-digit year, columns 21-32 = day-of-year with fraction.
  const yy = parseInt(line1.substring(18, 20), 10);
  const dayOfYear = parseFloat(line1.substring(20, 32));
  const year = yy < 57 ? 2000 + yy : 1900 + yy; // standard NORAD pivot
  const jan1 = Date.UTC(year, 0, 1);
  const ms = jan1 + (dayOfYear - 1) * 86400000;
  return new Date(ms).toISOString();
}

export function buildTLE(name: string, line1: string, line2: string): TLE {
  return {
    name: name.trim(),
    line1: line1.trim(),
    line2: line2.trim(),
    fetchedAt: new Date().toISOString(),
    epoch: parseEpoch(line1),
  };
}

/**
 * satellite.js exposes radiansToDegrees at runtime but its published type
 * declarations omit it, so we keep a locally-typed equivalent instead of
 * fighting the upstream types.
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function createSatRec(tle: TLE): SatRec {
  const raw = satellite.twoline2satrec(tle.line1, tle.line2);
  return { raw, tle };
}

/** How old the TLE is, in hours. Used to warn the user / trigger a refresh. */
export function tleAgeHours(tle: TLE): number {
  return (Date.now() - new Date(tle.epoch).getTime()) / 3_600_000;
}

/**
 * Propagate the satellite to a given time and return both its geographic
 * position (lat/lon/alt) and ECI vectors (needed for look-angle + shadow math).
 */
export function propagate(satrec: SatRec, date: Date) {
  const pv = satellite.propagate(satrec.raw, date);
  if (
    !pv.position ||
    !pv.velocity ||
    typeof pv.position === "boolean" ||
    typeof pv.velocity === "boolean"
  ) {
    return null;
  }
  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(pv.position, gmst);

  return {
    eciPosition: pv.position,
    eciVelocity: pv.velocity,
    gmst,
    geodetic: {
      latitude: satellite.degreesLat(geo.latitude),
      longitude: satellite.degreesLong(geo.longitude),
      altitudeKm: geo.height,
    },
  };
}

export function toISSPosition(satrec: SatRec, date: Date): ISSPosition | null {
  const prop = propagate(satrec, date);
  if (!prop) return null;
  const speed = Math.sqrt(
    prop.eciVelocity.x ** 2 + prop.eciVelocity.y ** 2 + prop.eciVelocity.z ** 2
  );
  return {
    latitude: prop.geodetic.latitude,
    longitude: prop.geodetic.longitude,
    altitudeKm: prop.geodetic.altitudeKm,
    velocityKmS: speed,
    timestamp: date.toISOString(),
  };
}

/** Look angles (az/el/range) from an observer to the ISS at a given time. */
export function lookAngles(
  satrec: SatRec,
  observer: ObserverLocation,
  date: Date
): LookAngles | null {
  const prop = propagate(satrec, date);
  if (!prop) return null;

  const observerGd = {
    latitude: satellite.degreesToRadians(observer.latitude),
    longitude: satellite.degreesToRadians(observer.longitude),
    height: observer.altitude / 1000, // km
  };

  const ecf = satellite.eciToEcf(prop.eciPosition, prop.gmst);
  const look = satellite.ecfToLookAngles(observerGd, ecf);

  const azDeg = radToDeg(look.azimuth);
  return {
    azimuthDeg: azDeg < 0 ? azDeg + 360 : azDeg,
    elevationDeg: radToDeg(look.elevation),
    rangeKm: look.rangeSat,
  };
}

export { satellite };
