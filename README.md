# ISSCOPE

A real-time ISS pass-prediction and sky-tracking app: when the International
Space Station will next be visible from your exact location, where to look,
and what it will do while you watch.

Built with Next.js (App Router) + TypeScript + satellite.js. No backend
database, no API keys, no third-party accounts required.

---

## 1. What's implemented

- **NEXT PASS hero** on the home screen — start time, duration, max
  altitude, direction, and a live countdown.
- **Sky View** — an all-sky "dome" map (concentric elevation rings at
  30°/60°/90°, compass points) showing the ISS's track across your sky, with
  a live-updating marker when it's above the horizon.
- **Live ISS** — current lat/lon/altitude/speed, a world map with a real
  day/night terminator (computed from actual sun geometry, not a static
  overlay) and the ISS ground track, plus an **Observation Mode** with a
  live countdown, current elevation, and direction sequence for use in the
  field.
- **Tonight / Passes** — all upcoming naked-eye-visible passes in the next 3
  days, grouped by day.
- **Pass detail** — start/max/end times, azimuths, duration, and the full
  sky-track for a single pass.
- **Settings** — geolocation with manual fallback (city presets or raw
  lat/lon), notification permission request, and TLE freshness/status with
  a manual refresh.
- **PWA** — manifest, service worker (app-shell caching only; live orbital
  data is never cached client-side), installable to a home screen.
- Responsive: bottom tab bar on mobile, sidebar on desktop; dark theme only.

### What's intentionally simplified (see "Roadmap" for how to extend)

- The **world map** draws a graticule + real day/night shading + ISS ground
  track, but not coastlines — adding `react-simple-maps`/`MapLibre` would
  give you real landmasses without changing the rest of the app.
- **Notifications** request permission and are wired for a "10 minutes
  before" trigger, but actually *firing* a notification while the tab is
  closed requires a push service (see Roadmap) — browsers can't wake up an
  arbitrary tab on their own.
- Brightness/magnitude estimation is out of scope; `ISSPass.magnitude` is
  reserved for it.

---

## 2. Data sources

| Data | Source | Notes |
|---|---|---|
| ISS orbital elements (TLE) | [CelesTrak GP data](https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE), NORAD ID 25544 | Public, no API key. Fetched server-side (see below), refreshed at most every 2 hours. |
| Orbit propagation | [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4/SDP4) | Industry-standard propagator, runs entirely client-side. |
| Sun position | Low-precision solar ephemeris (Astronomical Almanac formula, ~0.01° accuracy 1950–2050) | Implemented in `lib/astronomy.ts`; no external call needed. |
| Observer location | Browser Geolocation API, or manual entry | Never sent to any server — see Privacy below. |

### Why a server-side proxy for the TLE?

The browser doesn't fetch CelesTrak directly: their `robots.txt` disallows
automated client-style polling from arbitrary user agents, and CelesTrak
explicitly asks integrators not to have every end-user's browser hit their
servers directly (they've had to add bandwidth throttling because of this).
`src/app/api/tle/route.ts` fetches once per server, caches in memory for two
hours (matching CelesTrak's actual GP-data update cadence), and serves every
client from that cache. If the live fetch fails, it serves the last good
cache, and if there's no cache at all (e.g. first boot with no network) it
falls back to a hardcoded TLE in `lib/fallback-tle.ts` — clearly labeled as
a last resort, since TLEs go stale within days.

---

## 3. How ISS visibility is calculated

A pass is only reported as visible when **three conditions hold at once**:

1. **Elevation** — the ISS is at least 10° above the horizon (`lib/visibility.ts`,
   `MIN_VISIBLE_ELEVATION_DEG`). Below 10° it's usually lost in horizon haze.
2. **Observer's sky is dark** — the sun is below −6° altitude (civil
   twilight) at the observer's location (`lib/astronomy.ts: sunAltitude`).
   During daylight the ISS is invisible even directly overhead.
3. **The ISS itself is sunlit** — it's not in Earth's shadow
   (`lib/astronomy.ts: isIlluminated`, using the standard cylindrical-shadow
   model). In the middle of the night, the ISS is often *also* in shadow and
   invisible, which is why passes only happen in the hours around dawn/dusk.

`findVisiblePasses()` scans a rolling window (default 3 days) at 20-second
resolution, groups contiguous "visible" instants into passes, then
re-samples each pass at 10-second resolution to build the sky-track used by
the dome visualization and the pass-detail screen.

All look-angle (azimuth/elevation/range) and geodetic (lat/lon/altitude)
math goes through `lib/satellite.ts`, a thin typed wrapper around
satellite.js — no orbital mechanics is duplicated in UI code.

---

## 4. File structure

```
src/
 ├─ app/
 │   ├─ page.tsx              # Home
 │   ├─ sky/page.tsx          # Sky View (dome)
 │   ├─ iss/page.tsx          # Live ISS + Observation Mode
 │   ├─ passes/page.tsx       # Tonight / upcoming passes
 │   ├─ passes/[id]/page.tsx  # Pass detail
 │   ├─ settings/page.tsx     # Location, notifications, TLE status
 │   ├─ api/tle/route.ts      # Server-side CelesTrak proxy + cache
 │   └─ layout.tsx, globals.css
 │
 ├─ components/               # UI only — no orbital math in here
 │   ├─ NextPass.tsx, SkyView.tsx, ISSMap.tsx, PassCard.tsx,
 │   │   PassDetail.tsx, CountdownTimer.tsx, Navigation.tsx,
 │   │   StarField.tsx, GlassPanel.tsx, ErrorBanner.tsx,
 │   │   ServiceWorkerRegister.tsx
 │
 ├─ lib/                      # Calculation + data, framework-agnostic
 │   ├─ satellite.ts          # SGP4 propagation, look angles
 │   ├─ astronomy.ts          # Sun position, eclipse/shadow test
 │   ├─ visibility.ts         # Visible-pass finder
 │   ├─ location.ts           # Geolocation + manual fallback
 │   ├─ format.ts             # Compass/duration/time formatting
 │   ├─ tle-source.ts         # Client-side fetch of /api/tle
 │   └─ fallback-tle.ts       # Last-resort hardcoded TLE
 │
 ├─ hooks/
 │   ├─ useISSTracking.ts       # Central real-time state (1 Hz tick)
 │   └─ ISSTrackingContext.tsx  # Shares one tracking instance app-wide
 │
 └─ types/iss.ts              # Shared domain types
```

---

## 5. Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables or API keys are
required for the default configuration (CelesTrak's GP endpoint is public).

### Build

```bash
npm run build
npm start
```

---

## 6. Environment variables

None are required by default. If you later add a push-notification backend
or swap the map for a tiled provider, you'd typically add:

```bash
# .env.local (example only — not required today)
# NEXT_PUBLIC_MAP_TILE_URL=...
# VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
```

---

## 7. Deploying to Vercel

```bash
npm i -g vercel
vercel
```

The `/api/tle` route runs as a serverless function automatically — no extra
configuration needed. Because it's an in-memory cache, on Vercel each cold
serverless instance will do its own first fetch from CelesTrak; if you want
a single shared cache across instances, swap the in-memory `cache` variable
in `route.ts` for Vercel KV/Upstash Redis (a few lines).

---

## 8. Privacy

Observer coordinates are read via the Geolocation API (or typed in
manually) and stored only in the browser's `localStorage`. They are never
sent to `/api/tle` or any other endpoint — all pass/visibility calculation
happens client-side in the browser.

---

## 9. Roadmap / good next additions

- **Real push notifications**: wire up the Web Push API + a small serverless
  function that schedules a push ~10 minutes before `nextPass.startTime`
  (today, permission is requested but nothing schedules a background push).
- **Coastlines on the map**: swap the graticule-only `ISSMap` canvas for
  `react-simple-maps` or a static low-res world GeoJSON, keeping the same
  day/night shading and ground-track logic.
- **3D Earth view**: the brief mentions an optional 3D globe — Three.js is
  a natural fit for `/iss` if you want to go beyond the 2D map.
- **Brightness estimate**: `ISSPass.magnitude` is already reserved; a
  standard visual-magnitude model (range + phase angle) could populate it.
- **Multi-day TLE persistence**: cache the last-good TLE in `localStorage`
  too, so a returning user gets better-than-fallback data even before the
  network request resolves.
