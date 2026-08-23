/**
 * Finds naked-eye-visible ISS passes over a given observer within a time
 * window. A pass counts as "visible" only when, simultaneously:
 *   - the ISS is above the elevation threshold (geometrically visible), AND
 *   - the observer's sky is dark enough (sun below -6deg, civil twilight), AND
 *   - the ISS itself is sunlit (outside Earth's shadow).
 * This mirrors how real pass-prediction tools (e.g. Heavens-Above) work —
 * "it's above the horizon" alone is not enough.
 */
import type { SatRec } from "@/lib/satellite";
import { lookAngles, propagate } from "@/lib/satellite";
import { sunEciPosition, sunAltitude, isIlluminated } from "@/lib/astronomy";
import type { ISSPass, ObserverLocation, PassPoint, VisibilityTier } from "@/types/iss";

export const MIN_VISIBLE_ELEVATION_DEG = 10;
const COARSE_STEP_S = 20; // sampling resolution while scanning for passes
const TRACK_STEP_S = 10; // resolution of the stored sky-track for drawing

interface Instant {
  date: Date;
  elevationDeg: number;
  azimuthDeg: number;
  visible: boolean;
}

function sampleInstant(satrec: SatRec, observer: ObserverLocation, date: Date): Instant | null {
  const look = lookAngles(satrec, observer, date);
  if (!look) return null;

  const prop = propagate(satrec, date);
  if (!prop) return null;

  const sunEci = sunEciPosition(date);
  const lit = isIlluminated(prop.eciPosition, sunEci);
  const sunAlt = sunAltitude(observer, date);

  const visible =
    look.elevationDeg >= MIN_VISIBLE_ELEVATION_DEG && sunAlt < -6 && lit;

  return {
    date,
    elevationDeg: look.elevationDeg,
    azimuthDeg: look.azimuthDeg,
    visible,
  };
}

function tierForElevation(elevationDeg: number): VisibilityTier {
  if (elevationDeg < 0) return "below-horizon";
  if (elevationDeg < 30) return "marginal";
  if (elevationDeg < 60) return "good";
  return "excellent";
}

function buildTrack(satrec: SatRec, observer: ObserverLocation, start: Date, end: Date): PassPoint[] {
  const track: PassPoint[] = [];
  const durationS = (end.getTime() - start.getTime()) / 1000;
  const steps = Math.max(2, Math.ceil(durationS / TRACK_STEP_S));

  for (let i = 0; i <= steps; i++) {
    const t = new Date(start.getTime() + (i * durationS * 1000) / steps);
    const look = lookAngles(satrec, observer, t);
    const prop = propagate(satrec, t);
    if (!look || !prop) continue;
    const sunEci = sunEciPosition(t);
    track.push({
      timestamp: t.toISOString(),
      azimuthDeg: look.azimuthDeg,
      elevationDeg: look.elevationDeg,
      illuminated: isIlluminated(prop.eciPosition, sunEci),
    });
  }
  return track;
}

/**
 * Scan [from, from+windowDays] for visible passes. Coarse scan finds
 * candidate intervals; each interval is then re-sampled at higher
 * resolution to build an accurate sky-track for the UI.
 */
export function findVisiblePasses(
  satrec: SatRec,
  observer: ObserverLocation,
  from: Date,
  windowDays: number
): ISSPass[] {
  const passes: ISSPass[] = [];
  const endWindow = new Date(from.getTime() + windowDays * 86400000);

  let cursor = new Date(from);
  let inCandidate = false;
  let candidateStart: Date | null = null;
  let candidateEnd: Date | null = null;

  while (cursor <= endWindow) {
    const instant = sampleInstant(satrec, observer, cursor);
    if (instant?.visible) {
      if (!inCandidate) {
        inCandidate = true;
        candidateStart = new Date(cursor.getTime() - COARSE_STEP_S * 1000);
      }
      candidateEnd = new Date(cursor.getTime() + COARSE_STEP_S * 1000);
    } else if (inCandidate && candidateStart && candidateEnd) {
      passes.push(resolvePass(satrec, observer, candidateStart, candidateEnd, passes.length));
      inCandidate = false;
      candidateStart = null;
      candidateEnd = null;
    }
    cursor = new Date(cursor.getTime() + COARSE_STEP_S * 1000);
  }
  if (inCandidate && candidateStart && candidateEnd) {
    passes.push(resolvePass(satrec, observer, candidateStart, candidateEnd, passes.length));
  }

  return passes;
}

function resolvePass(
  satrec: SatRec,
  observer: ObserverLocation,
  roughStart: Date,
  roughEnd: Date,
  index: number
): ISSPass {
  const track = buildTrack(satrec, observer, roughStart, roughEnd);

  let maxPoint = track[0];
  for (const p of track) {
    if (maxPoint === undefined || p.elevationDeg > maxPoint.elevationDeg) maxPoint = p;
  }
  const startPoint = track[0];
  const endPoint = track[track.length - 1];

  const maxElevationDeg = maxPoint?.elevationDeg ?? 0;
  const start = startPoint ? new Date(startPoint.timestamp) : roughStart;
  const end = endPoint ? new Date(endPoint.timestamp) : roughEnd;
  const max = maxPoint ? new Date(maxPoint.timestamp) : roughStart;

  return {
    id: `pass-${start.getTime()}-${index}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    maxTime: max.toISOString(),
    startAzimuthDeg: startPoint?.azimuthDeg ?? 0,
    maxAzimuthDeg: maxPoint?.azimuthDeg ?? 0,
    endAzimuthDeg: endPoint?.azimuthDeg ?? 0,
    maxElevationDeg,
    durationSeconds: Math.max(0, (end.getTime() - start.getTime()) / 1000),
    magnitude: null,
    track,
    visibilityTier: tierForElevation(maxElevationDeg),
  };
}
