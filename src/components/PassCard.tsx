import Link from "next/link";
import { compassDirection, formatDuration, formatLocalTimeShort } from "@/lib/format";
import type { ISSPass } from "@/types/iss";

const TIER_COLOR: Record<ISSPass["visibilityTier"], string> = {
  "below-horizon": "text-white/30",
  marginal: "text-blue",
  good: "text-cyan",
  excellent: "text-white",
};

export default function PassCard({ pass }: { pass: ISSPass }) {
  return (
    <Link
      href={`/passes/${pass.id}`}
      className="flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-white/5 transition-colors border-b border-white/5 last:border-none"
    >
      <div className="flex items-center gap-4">
        <div className={`w-1 h-10 rounded-full ${pass.visibilityTier === "excellent" ? "bg-cyan" : "bg-blue/60"}`} />
        <div>
          <p className="text-xl font-medium tabular">{formatLocalTimeShort(pass.startTime)}</p>
          <p className="text-xs text-white/40">
            {compassDirection(pass.startAzimuthDeg)} → {compassDirection(pass.endAzimuthDeg)} ·{" "}
            {formatDuration(pass.durationSeconds)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-semibold tabular ${TIER_COLOR[pass.visibilityTier]}`}>
          {Math.round(pass.maxElevationDeg)}°
        </p>
        <p className="text-[10px] text-white/35 tracking-wide">MAX ALT</p>
      </div>
    </Link>
  );
}
