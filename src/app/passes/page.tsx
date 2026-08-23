"use client";

import { useTracking } from "@/hooks/ISSTrackingContext";
import PassCard from "@/components/PassCard";
import GlassPanel from "@/components/GlassPanel";

export default function PassesPage() {
  const { passes, observer, status } = useTracking();

  const grouped = groupByDay(passes);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Upcoming Passes</h1>
        <p className="text-white/40 text-sm mt-0.5">{observer.label} · next 3 days</p>
      </header>

      {status === "loading" && passes.length === 0 && (
        <GlassPanel className="animate-pulse-soft">
          <p className="text-sm text-white/50">Scanning the next few days for visible passes…</p>
        </GlassPanel>
      )}

      {status !== "loading" && passes.length === 0 && (
        <GlassPanel>
          <p className="text-sm text-white/45">
            No naked-eye-visible passes found in this window. This is normal for parts of the ISS's ~2-month
            visibility cycle at your latitude.
          </p>
        </GlassPanel>
      )}

      {Object.entries(grouped).map(([day, dayPasses]) => (
        <GlassPanel key={day} className="!p-0">
          <div className="px-5 pt-4 pb-1">
            <p className="text-xs tracking-[0.2em] text-white/40">{day}</p>
          </div>
          <div className="px-1 pb-1">
            {dayPasses.map((p) => (
              <PassCard key={p.id} pass={p} />
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

function groupByDay(passes: ReturnType<typeof useTracking>["passes"]) {
  const out: Record<string, typeof passes> = {};
  for (const p of passes) {
    const d = new Date(p.startTime);
    const key = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
    out[key] = out[key] ? [...out[key], p] : [p];
  }
  return out;
}
