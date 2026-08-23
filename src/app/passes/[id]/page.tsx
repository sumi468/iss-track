"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTracking } from "@/hooks/ISSTrackingContext";
import PassDetail from "@/components/PassDetail";
import GlassPanel from "@/components/GlassPanel";

export default function PassDetailPage() {
  const params = useParams<{ id: string }>();
  const { passes } = useTracking();
  const pass = passes.find((p) => p.id === params.id);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href="/passes" className="text-white/40 text-sm">
          ← Back
        </Link>
      </header>

      {pass ? (
        <PassDetail pass={pass} />
      ) : (
        <GlassPanel>
          <p className="text-sm text-white/45">
            This pass is no longer in the current forecast window. Return to Passes for the latest list.
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
