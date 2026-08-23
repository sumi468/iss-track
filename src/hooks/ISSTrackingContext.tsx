"use client";

import { createContext, useContext } from "react";
import { useISSTracking, type ISSTrackingState } from "@/hooks/useISSTracking";

const Ctx = createContext<ISSTrackingState | null>(null);

export function ISSTrackingProvider({ children }: { children: React.ReactNode }) {
  const state = useISSTracking();
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

/** Access the single shared tracking instance (location, TLE, live position, passes). */
export function useTracking(): ISSTrackingState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTracking must be used within <ISSTrackingProvider>");
  return ctx;
}
