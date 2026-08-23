import GlassPanel from "@/components/GlassPanel";
import SkyView from "@/components/SkyView";
import { compassDirection, formatDuration, formatLocalTime, timeZoneAbbreviation } from "@/lib/format";
import type { ISSPass } from "@/types/iss";

export default function PassDetail({ pass }: { pass: ISSPass }) {
  const tz = timeZoneAbbreviation();

  return (
    <div className="space-y-4">
      <GlassPanel>
        <p className="text-xs tracking-[0.2em] text-white/40 mb-4">ISS PASS · {tz}</p>
        <div className="aspect-square max-w-sm mx-auto">
          <SkyView track={pass.track} />
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
          <Field label="START" value={formatLocalTime(pass.startTime)} sub={compassDirection(pass.startAzimuthDeg)} />
          <Field label="MAX ALTITUDE" value={formatLocalTime(pass.maxTime)} sub={`${Math.round(pass.maxElevationDeg)}°`} />
          <Field label="END" value={formatLocalTime(pass.endTime)} sub={compassDirection(pass.endAzimuthDeg)} />
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="flex items-center justify-between">
          <Field label="DURATION" value={formatDuration(pass.durationSeconds)} />
          <Field
            label="PEAK DIRECTION"
            value={compassDirection(pass.maxAzimuthDeg)}
          />
          <Field label="VISIBILITY" value={tierLabel(pass.visibilityTier)} />
        </div>
      </GlassPanel>
    </div>
  );
}

function tierLabel(tier: ISSPass["visibilityTier"]) {
  switch (tier) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "marginal":
      return "Marginal";
    default:
      return "—";
  }
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] text-white/35 mb-1">{label}</p>
      <p className="text-xl font-semibold tabular">{value}</p>
      {sub && <p className="text-xs text-cyan mt-0.5">{sub}</p>}
    </div>
  );
}
