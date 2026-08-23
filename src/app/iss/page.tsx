"use client";

import { useState } from "react";
import { useTracking } from "@/hooks/ISSTrackingContext";
import ISSMap from "@/components/ISSMap";
import GlassPanel from "@/components/GlassPanel";
import CountdownTimer from "@/components/CountdownTimer";
import { compassDirection } from "@/lib/format";

export default function ISSPage() {
  const { satrecInternal, issPosition, look, nextPass, observer, now } = useLiveISS();
  const [observing, setObserving] = useState(false);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Live ISS</h1>
        <p className="text-white/40 text-sm mt-0.5">
          {issPosition ? `${issPosition.altitudeKm.toFixed(0)} km altitude · ${issPosition.velocityKmS.toFixed(2)} km/s` : "—"}
        </p>
      </header>

      <GlassPanel className="!p-2">
        <ISSMap satrec={satrecInternal} observer={observer} now={now} />
      </GlassPanel>

      <GlassPanel>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="LATITUDE" value={issPosition ? `${issPosition.latitude.toFixed(2)}°` : "—"} />
          <Stat label="LONGITUDE" value={issPosition ? `${issPosition.longitude.toFixed(2)}°` : "—"} />
        </div>
      </GlassPanel>

      {!observing ? (
        <button
          onClick={() => setObserving(true)}
          className="w-full py-4 rounded-2xl glass-chip text-sm text-cyan hover:bg-white/10 transition-colors"
        >
          START OBSERVATION
        </button>
      ) : (
        <GlassPanel>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs tracking-[0.2em] text-white/40">OBSERVATION MODE</p>
            <button onClick={() => setObserving(false)} className="text-xs text-white/40">
              Exit
            </button>
          </div>

          {nextPass ? (
            <>
              <p className="text-sm text-cyan mb-1">ISS APPROACHING</p>
              <p className="text-5xl font-semibold tabular accent-text">
                <CountdownTimer targetIso={nextPass.startTime} />
              </p>
              <p className="text-white/50 text-sm mt-3">
                {compassDirection(nextPass.startAzimuthDeg)} → {compassDirection(nextPass.maxAzimuthDeg)} →{" "}
                {compassDirection(nextPass.endAzimuthDeg)}
              </p>
              <div className="mt-5">
                <p className="text-[10px] tracking-[0.15em] text-white/35 mb-1">CURRENT ELEVATION</p>
                <p className="text-3xl font-semibold tabular">
                  {look ? `${Math.max(0, Math.round(look.elevationDeg))}°` : "—"}
                </p>
                <p className="text-xs text-white/40 mt-1">↑ target {Math.round(nextPass.maxElevationDeg)}°</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/45">No upcoming pass to observe right now.</p>
          )}
        </GlassPanel>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] text-white/35 mb-1">{label}</p>
      <p className="text-lg font-medium tabular">{value}</p>
    </div>
  );
}

/**
 * The shared tracking context deliberately doesn't expose the raw SatRec
 * (it's an internal orbital-propagation detail, not app state). ISSMap needs
 * it for ground-track sampling, so this small adapter hook re-derives it
 * from context state without duplicating the TLE fetch/timer logic.
 */
function useLiveISS() {
  const tracking = useTracking();
  return { ...tracking, satrecInternal: tracking.satrecForMap };
}
