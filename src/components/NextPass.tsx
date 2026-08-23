import Link from "next/link";
import GlassPanel from "@/components/GlassPanel";
import CountdownTimer from "@/components/CountdownTimer";
import SkyView from "@/components/SkyView";
import { compassDirection, formatDuration, formatLocalTimeShort, timeZoneAbbreviation } from "@/lib/format";
import type { ISSPass } from "@/types/iss";

export default function NextPass({ pass }: { pass: ISSPass | null }) {
  if (!pass) {
    return (
      <GlassPanel className="animate-fade-in-up">
        <p className="text-xs tracking-[0.2em] text-white/40 mb-2">NEXT PASS</p>
        <p className="text-white/60 text-sm leading-relaxed">
          No visible passes found in the next few days from your location. Check back later — the ISS's
          orbit shifts a few degrees west each day, so visibility windows come and go.
        </p>
      </GlassPanel>
    );
  }

  const tz = timeZoneAbbreviation();

  return (
    <Link href={`/passes/${pass.id}`} className="block">
      <GlassPanel className="animate-fade-in-up hover:bg-white/[0.07] transition-colors">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs tracking-[0.2em] text-white/40">NEXT PASS</p>
          <span className="text-xs text-cyan tabular">
            in <CountdownTimer targetIso={pass.startTime} />
          </span>
        </div>

        <p className="text-6xl font-semibold tabular accent-text leading-none mt-2">
          {formatLocalTimeShort(pass.startTime)}
        </p>
        <p className="text-white/40 text-xs mt-1">{tz}</p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <Stat label="VISIBLE FOR" value={formatDuration(pass.durationSeconds)} />
          <Stat label="MAX ALTITUDE" value={`${Math.round(pass.maxElevationDeg)}°`} />
          <Stat
            label="DIRECTION"
            value={`${compassDirection(pass.startAzimuthDeg)} → ${compassDirection(pass.endAzimuthDeg)}`}
          />
        </div>

        <div className="mt-6 -mx-2 h-40">
          <SkyView track={pass.track} compact />
        </div>
      </GlassPanel>
    </Link>
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
