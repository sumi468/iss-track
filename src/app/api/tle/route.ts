/**
 * GET /api/tle
 *
 * Server-side proxy for the ISS TLE. We fetch this on the server rather
 * than directly from the browser for two reasons:
 *   1. CelesTrak's terms/robots rules and bandwidth limits are meant for
 *      server-to-server polling, not thousands of individual browsers.
 *   2. It lets us cache + rate-limit centrally, so ISSCOPE only hits
 *      CelesTrak at most once every REFRESH_INTERVAL_MS regardless of how
 *      many users load the app, and every client benefits from the cache.
 *
 * No API key is required — CelesTrak's GP data endpoint is public.
 */
import { NextResponse } from "next/server";
import { FALLBACK_TLE } from "@/lib/fallback-tle";

export const dynamic = "force-dynamic";

const CELESTRAK_URL =
  "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000; // CelesTrak GP data updates ~every few hours

let cache: { name: string; line1: string; line2: string; fetchedAt: number } | null = null;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < REFRESH_INTERVAL_MS) {
    return NextResponse.json({ ...cache, source: "cache" });
  }

  try {
    const res = await fetch(CELESTRAK_URL, {
      headers: { "User-Agent": "ISSCOPE/1.0 (contact: set-in-deployment)" },
      // CelesTrak is a small non-profit service; be a good citizen.
      next: { revalidate: REFRESH_INTERVAL_MS / 1000 },
    });

    if (!res.ok) throw new Error(`CelesTrak responded ${res.status}`);

    const text = await res.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 3) throw new Error("Unexpected TLE format");

    const [name, line1, line2] = lines;
    if (!line1?.startsWith("1 ") || !line2?.startsWith("2 ")) {
      throw new Error("Malformed TLE lines");
    }

    cache = { name: name ?? "ISS (ZARYA)", line1, line2, fetchedAt: now };
    return NextResponse.json({ ...cache, source: "live" });
  } catch (err) {
    // Fall back to the last good cache if we have one, otherwise the
    // hardcoded constant. Either way, tell the client honestly what happened.
    if (cache) {
      return NextResponse.json({ ...cache, source: "cache-stale" });
    }
    return NextResponse.json(
      {
        ...FALLBACK_TLE,
        fetchedAt: now,
        source: "fallback",
        error: err instanceof Error ? err.message : "unknown error",
      },
      { status: 200 }
    );
  }
}
