/**
 * Minimal solar-position + eclipse math needed to decide whether a pass is
 * actually *visible* (dark sky at the observer, ISS sunlit) rather than just
 * geometrically above the horizon.
 *
 * Sun position uses the low-precision formula from the Astronomical Almanac
 * (accurate to ~0.01deg, 1950-2050), which is more than sufficient for
 * pass-visibility classification. Shadow test uses the standard cylindrical
 * shadow model (ignores penumbra/atmosphere) — the same simplification used
 * by most amateur pass-prediction tools (e.g. Heavens-Above).
 */
import * as satellite from "satellite.js";
import { radToDeg } from "@/lib/satellite";
import type { ObserverLocation, SunGeometry } from "@/types/iss";

const AU_KM = 149_597_870.7;
const EARTH_RADIUS_KM = 6378.137;
const DEG = Math.PI / 180;

/** Sun's ECI (geocentric equatorial, unit-ish AU-scaled) position vector, in km. */
export function sunEciPosition(date: Date): { x: number; y: number; z: number } {
  const JD =
    date.getTime() / 86400000 + 2440587.5; // Unix epoch -> Julian Date
  const n = JD - 2451545.0; // days since J2000.0

  const L = normalizeDeg(280.46 + 0.9856474 * n); // mean longitude
  const g = normalizeDeg(357.528 + 0.9856003 * n); // mean anomaly
  const lambda = normalizeDeg(
    L + 1.915 * Math.sin(g * DEG) + 0.02 * Math.sin(2 * g * DEG)
  ); // ecliptic longitude
  const epsilon = 23.439 - 0.0000004 * n; // obliquity of the ecliptic

  const r = 1.00014 - 0.01671 * Math.cos(g * DEG) - 0.00014 * Math.cos(2 * g * DEG); // AU

  const x = r * Math.cos(lambda * DEG);
  const y = r * Math.cos(epsilon * DEG) * Math.sin(lambda * DEG);
  const z = r * Math.sin(epsilon * DEG) * Math.sin(lambda * DEG);

  return { x: x * AU_KM, y: y * AU_KM, z: z * AU_KM };
}

function normalizeDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Sun altitude in degrees as seen from the observer at `date`. */
export function sunAltitude(observer: ObserverLocation, date: Date): number {
  const sunEci = sunEciPosition(date);
  const gmst = satellite.gstime(date);
  const sunEcf = satellite.eciToEcf(sunEci, gmst);

  const observerGd = {
    latitude: satellite.degreesToRadians(observer.latitude),
    longitude: satellite.degreesToRadians(observer.longitude),
    height: observer.altitude / 1000,
  };

  const look = satellite.ecfToLookAngles(observerGd, sunEcf);
  return radToDeg(look.elevation);
}

/**
 * Is a point at ECI `satEci` illuminated by the sun, i.e. NOT inside Earth's
 * cylindrical shadow? `sunEci` should be the sun's ECI position at the same
 * instant (see sunEciPosition).
 */
export function isIlluminated(
  satEci: { x: number; y: number; z: number },
  sunEci: { x: number; y: number; z: number }
): boolean {
  const sunDist = Math.sqrt(sunEci.x ** 2 + sunEci.y ** 2 + sunEci.z ** 2);
  const sunHat = { x: sunEci.x / sunDist, y: sunEci.y / sunDist, z: sunEci.z / sunDist };

  // Projection of the satellite position onto the sun direction.
  const proj = satEci.x * sunHat.x + satEci.y * sunHat.y + satEci.z * sunHat.z;

  if (proj > 0) {
    // Satellite is on the sun-facing side of Earth's center -> always lit.
    return true;
  }

  // Perpendicular distance from the satellite to the Earth-Sun axis.
  const perp = {
    x: satEci.x - proj * sunHat.x,
    y: satEci.y - proj * sunHat.y,
    z: satEci.z - proj * sunHat.z,
  };
  const perpDist = Math.sqrt(perp.x ** 2 + perp.y ** 2 + perp.z ** 2);

  // Inside the shadow cylinder if the perpendicular distance is less than
  // Earth's radius (cylindrical/umbra-only approximation, no penumbra taper).
  return perpDist > EARTH_RADIUS_KM;
}

/** Sub-solar point (lat/lon directly under the sun) at `date`, for map shading. */
export function subsolarPoint(date: Date): { latitude: number; longitude: number } {
  const sunEci = sunEciPosition(date);
  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(sunEci, gmst);
  return {
    latitude: satellite.degreesLat(geo.latitude),
    longitude: satellite.degreesLong(geo.longitude),
  };
}

export function sunGeometry(
  observer: ObserverLocation,
  date: Date,
  satEci: { x: number; y: number; z: number } | null
): SunGeometry {
  const sunEci = sunEciPosition(date);
  return {
    sunAltitudeDeg: sunAltitude(observer, date),
    issIlluminated: satEci ? isIlluminated(satEci, sunEci) : false,
  };
}

/**
 * A pass is visible to the naked eye only when the sky is dark enough at the
 * observer (sun below civil/nautical twilight) *and* the ISS itself is still
 * sunlit. During full daylight the ISS is invisible even directly overhead;
 * in the middle of the night with the ISS in Earth's shadow, it's also dark.
 */
export function isObservingConditionMet(sunAltitudeDeg: number, issIlluminated: boolean): boolean {
  return sunAltitudeDeg < -6 && issIlluminated;
}
