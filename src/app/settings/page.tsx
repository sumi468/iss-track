"use client";

import { useState } from "react";
import { useTracking } from "@/hooks/ISSTrackingContext";
import GlassPanel from "@/components/GlassPanel";
import ErrorBanner from "@/components/ErrorBanner";
import { CITY_PRESETS, requestBrowserLocation } from "@/lib/location";
import type { AppError } from "@/types/iss";

export default function SettingsPage() {
  const { observer, setObserver, tleSource, tleAgeHours, refresh, status } = useTracking();
  const [locError, setLocError] = useState<AppError | null>(null);
  const [locating, setLocating] = useState(false);
  const [manual, setManual] = useState({ lat: String(observer.latitude), lon: String(observer.longitude) });
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  async function useMyLocation() {
    setLocating(true);
    setLocError(null);
    const res = await requestBrowserLocation();
    setLocating(false);
    if (res.ok) {
      setObserver(res.location);
    } else {
      setLocError(res.error);
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>

      {locError && <ErrorBanner error={locError} />}

      <GlassPanel>
        <p className="text-xs tracking-[0.2em] text-white/40 mb-4">OBSERVATION LOCATION</p>
        <p className="text-lg mb-4">{observer.label}</p>

        <button
          onClick={useMyLocation}
          disabled={locating}
          className="w-full py-3 rounded-xl glass-chip text-sm text-cyan hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {locating ? "Locating…" : "Use my current location"}
        </button>

        <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
          Your coordinates stay on this device — ISSCOPE never sends location data to a server.
        </p>

        <div className="mt-5">
          <p className="text-[10px] tracking-[0.15em] text-white/35 mb-2">OR CHOOSE A CITY</p>
          <div className="grid grid-cols-2 gap-2">
            {CITY_PRESETS.map((c) => (
              <button
                key={c.label}
                onClick={() => setObserver(c)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  c.label === observer.label ? "bg-cyan/15 text-cyan" : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] tracking-[0.15em] text-white/35 mb-2">OR ENTER COORDINATES</p>
          <div className="flex gap-2">
            <input
              value={manual.lat}
              onChange={(e) => setManual((m) => ({ ...m, lat: e.target.value }))}
              placeholder="Latitude"
              inputMode="decimal"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan/50"
            />
            <input
              value={manual.lon}
              onChange={(e) => setManual((m) => ({ ...m, lon: e.target.value }))}
              placeholder="Longitude"
              inputMode="decimal"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan/50"
            />
            <button
              onClick={() => {
                const lat = parseFloat(manual.lat);
                const lon = parseFloat(manual.lon);
                if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
                  setObserver({ label: "Custom location", latitude: lat, longitude: lon, altitude: 0, source: "manual" });
                }
              }}
              className="px-4 rounded-xl bg-cyan/15 text-cyan text-sm"
            >
              Set
            </button>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <p className="text-xs tracking-[0.2em] text-white/40 mb-3">NOTIFICATIONS</p>
        <p className="text-sm text-white/60 mb-3">Get notified about 10 minutes before a visible pass begins.</p>
        {notifStatus === "unsupported" ? (
          <p className="text-sm text-white/40">Not supported in this browser.</p>
        ) : notifStatus === "granted" ? (
          <p className="text-sm text-cyan">Enabled</p>
        ) : (
          <button onClick={requestNotifications} className="px-4 py-2.5 rounded-xl glass-chip text-sm text-cyan">
            {notifStatus === "denied" ? "Blocked — enable in browser settings" : "Enable notifications"}
          </button>
        )}
      </GlassPanel>

      <GlassPanel>
        <p className="text-xs tracking-[0.2em] text-white/40 mb-3">ORBITAL DATA</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Source</span>
          <span className="tabular">{tleSource ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-white/60">Age</span>
          <span className="tabular">{tleAgeHours != null ? `${tleAgeHours.toFixed(1)} h` : "—"}</span>
        </div>
        <button
          onClick={refresh}
          disabled={status === "loading"}
          className="w-full mt-4 py-2.5 rounded-xl glass-chip text-sm text-cyan hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Refreshing…" : "Refresh now"}
        </button>
      </GlassPanel>
    </div>
  );
}
