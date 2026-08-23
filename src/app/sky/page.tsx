"use client";

import { useTracking } from "@/hooks/ISSTrackingContext";
import SkyView from "@/components/SkyView";
import GlassPanel from "@/components/GlassPanel";
import { compassDirection } from "@/lib/format";

export default function SkyPage() {
  const { look, nextPass, observer } = useTracking();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Sky View</h1>
        <p className="text-white/40 text-sm mt-0.5">{observer.label}</p>
      </header>

      <GlassPanel>
        <div className="aspect-square max-w-md mx-auto">
          <SkyView track={nextPass?.track ?? []} live={look} />
        </div>
      </GlassPanel>

      <GlassPanel>
        {look && look.elevationDeg > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            <Stat label="AZIMUTH" value={`${Math.round(look.azimuthDeg)}° ${compassDirection(look.azimuthDeg)}`} />
            <Stat label="ELEVATION" value={`${Math.round(look.elevationDeg)}°`} />
            <Stat label="RANGE" value={`${Math.round(look.rangeKm)} km`} />
          </div>
        ) : (
          <p className="text-sm text-white/45">
            The ISS is currently below your horizon. The dome above shows the path of your next visible pass.
          </p>
        )}
      </GlassPanel>
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
