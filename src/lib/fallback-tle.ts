/**
 * A hardcoded ISS TLE used ONLY as a last-resort fallback (offline, or the
 * live fetch in /api/tle fails) and for local development without network
 * access. This is NOT meant to be relied on for real observation planning —
 * TLEs drift and become inaccurate within days as atmospheric drag and
 * reboosts change the ISS orbit. The app always prefers the live value from
 * /api/tle (see lib/tle-source.ts), which proxies CelesTrak's current GP
 * data and is refreshed on every load (throttled server-side, see route.ts).
 *
 * Source: CelesTrak GP data for NORAD ID 25544, epoch ~2026-05-13.
 */
export const FALLBACK_TLE = {
  name: "ISS (ZARYA)",
  line1: "1 25544U 98067A   26133.42450843  .00004829  00000+0  95080-4 0  9993",
  line2: "2 25544  51.6310 112.1825 0007522  54.1994 305.9693 15.49203550566361",
};
