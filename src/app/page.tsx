"use client";

import Link from "next/link";
import { useTracking } from "@/hooks/ISSTrackingContext";
import NextPass from "@/components/NextPass";
import PassCard from "@/components/PassCard";
import SkyView from "@/components/SkyView";
import GlassPanel from "@/components/GlassPanel";
import ErrorBanner from "@/components/ErrorBanner";

export default function HomePage() {
  const { observer, nextPass, passes, look, status, error, refresh, tleSource } = useTracking();

  const now = Date.now();
  const tonight = passes.filter((p) => (new Date(p.startTime).getTime() - now) / 3600000 < 20);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ISSCOPE</h1>
          <p className="text-white/40 text-sm mt-0.5">
            YOUR SKY · <span className="text-white/70">{observer.label}</span>
          </p>
        </div>
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-white/50 text-xs"
        >
          ⚙
        </Link>
      </header>

      {error && <ErrorBanner error={error} onRetry={refresh} />}
      {!error && tleSource === "cache-stale" && (
        <ErrorBanner error={{ code: "TLE_STALE", message: "" }} onRetry={refresh} />
      )}

      {status === "loading" && !nextPass ? (
        <GlassPanel className="animate-pulse-soft">
          <p className="text-sm text-white/50">Acquiring ISS orbital data…</p>
        </GlassPanel>
      ) : (
        <NextPass pass={nextPass} />
      )}

      <Link href="/sky" className="block">
        <GlassPanel className="!p-0 overflow-hidden hover:bg-white/[0.06] transition-colors">
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-xs tracking-[0.2em] text-white/40">SKY VIEW</p>
            <span className="text-xs text-white/30">Open →</span>
          </div>
          <div className="h-52 -mt-2">
            <SkyView track={nextPass?.track ?? []} live={look} compact />
          </div>
        </GlassPanel>
      </Link>

      <GlassPanel className="!p-0">
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs tracking-[0.2em] text-white/40">TONIGHT</p>
        </div>
        {tonight.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-white/40">No more visible passes in this window.</p>
        ) : (
          <div className="px-1 pb-1">
            {tonight.slice(0, 4).map((p) => (
              <PassCard key={p.id} pass={p} />
            ))}
          </div>
        )}
      </GlassPanel>

      <Link
        href="/iss"
        className="flex items-center justify-center gap-2 py-4 rounded-2xl glass-chip text-sm text-cyan hover:bg-white/10 transition-colors"
      >
        START OBSERVATION →
      </Link>
    </div>
  );
}
