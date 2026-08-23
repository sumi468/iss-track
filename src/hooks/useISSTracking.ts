"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createSatRec, lookAngles, toISSPosition, tleAgeHours, type SatRec } from "@/lib/satellite";
import { fetchLatestTLE } from "@/lib/tle-source";
import { findVisiblePasses } from "@/lib/visibility";
import { sunAltitude, sunEciPosition, isIlluminated } from "@/lib/astronomy";
import { propagate } from "@/lib/satellite";
import { DEFAULT_LOCATION, loadSavedLocation, saveLocation } from "@/lib/location";
import type { AppError, ConnectionState, ISSPass, LookAngles, ObserverLocation, ISSPosition } from "@/types/iss";

const LOOK_UPDATE_MS = 1000;
const PASS_WINDOW_DAYS = 3;

export interface ISSTrackingState {
  status: ConnectionState;
  error: AppError | null;
  observer: ObserverLocation;
  setObserver: (loc: ObserverLocation) => void;
  now: Date;
  issPosition: ISSPosition | null;
  look: LookAngles | null;
  sunAltitudeDeg: number | null;
  issIlluminated: boolean | null;
  passes: ISSPass[];
  nextPass: ISSPass | null;
  tleSource: string | null;
  tleAgeHours: number | null;
  refresh: () => void;
  /** Internal SatRec, exposed only for components that need direct propagation (e.g. the live map). */
  satrecForMap: SatRec | null;
}

export function useISSTracking(): ISSTrackingState {
  const [observer, setObserverState] = useState<ObserverLocation>(DEFAULT_LOCATION);
  const [status, setStatus] = useState<ConnectionState>("idle");
  const [error, setError] = useState<AppError | null>(null);
  const [satrec, setSatrec] = useState<SatRec | null>(null);
  const [tleSource, setTleSource] = useState<string | null>(null);
  const [passes, setPasses] = useState<ISSPass[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) setObserverState(saved);
  }, []);

  const setObserver = useCallback((loc: ObserverLocation) => {
    setObserverState(loc);
    saveLocation(loc);
  }, []);

  const loadTLE = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const online = typeof navigator === "undefined" || navigator.onLine;
      if (!online) {
        setError({ code: "OFFLINE", message: "No internet connection." });
      }
      const { tle, source } = await fetchLatestTLE();
      const rec = createSatRec(tle);
      setSatrec(rec);
      setTleSource(source);
      setStatus(source === "fallback" ? "stale" : "ready");
    } catch {
      setError({
        code: "TLE_FETCH_FAILED",
        message: "Could not load ISS orbital data. Please try again shortly.",
      });
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadTLE();
  }, [loadTLE, refreshTick]);

  // 1Hz clock + look-angle tick.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), LOOK_UPDATE_MS);
    return () => clearInterval(id);
  }, []);

  // Recompute the visible-pass list whenever the satrec or observer changes.
  useEffect(() => {
    if (!satrec) return;
    try {
      const found = findVisiblePasses(satrec, observer, new Date(), PASS_WINDOW_DAYS);
      setPasses(found);
    } catch {
      setError({ code: "UNKNOWN", message: "Could not compute visible passes." });
    }
  }, [satrec, observer]);

  const look = useMemo(() => (satrec ? lookAngles(satrec, observer, now) : null), [satrec, observer, now]);
  const issPosition = useMemo(() => (satrec ? toISSPosition(satrec, now) : null), [satrec, now]);

  const sunInfo = useMemo(() => {
    if (!satrec) return { sunAltitudeDeg: null, issIlluminated: null };
    const prop = propagate(satrec, now);
    if (!prop) return { sunAltitudeDeg: null, issIlluminated: null };
    const sunEci = sunEciPosition(now);
    return {
      sunAltitudeDeg: sunAltitude(observer, now),
      issIlluminated: isIlluminated(prop.eciPosition, sunEci),
    };
  }, [satrec, observer, now]);

  const nextPass = useMemo(() => {
    const upcoming = passes.filter((p) => new Date(p.endTime) > now);
    return upcoming[0] ?? null;
  }, [passes, now]);

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return {
    status,
    error,
    observer,
    setObserver,
    now,
    issPosition,
    look,
    sunAltitudeDeg: sunInfo.sunAltitudeDeg,
    issIlluminated: sunInfo.issIlluminated,
    passes,
    nextPass,
    tleSource,
    tleAgeHours: satrec ? tleAgeHours(satrec.tle) : null,
    refresh,
    satrecForMap: satrec,
  };
}
