import { buildTLE } from "@/lib/satellite";
import { FALLBACK_TLE } from "@/lib/fallback-tle";
import type { TLE } from "@/types/iss";

export interface TLEFetchResult {
  tle: TLE;
  source: "live" | "cache" | "cache-stale" | "fallback";
}

export async function fetchLatestTLE(): Promise<TLEFetchResult> {
  try {
    const res = await fetch("/api/tle", { cache: "no-store" });
    if (!res.ok) throw new Error(`/api/tle responded ${res.status}`);
    const data = await res.json();
    const tle = buildTLE(data.name ?? "ISS (ZARYA)", data.line1, data.line2);
    return { tle, source: data.source ?? "live" };
  } catch {
    const tle = buildTLE(FALLBACK_TLE.name, FALLBACK_TLE.line1, FALLBACK_TLE.line2);
    return { tle, source: "fallback" };
  }
}
