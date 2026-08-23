"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export default function CountdownTimer({ targetIso, className }: { targetIso: string; className?: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const remaining = new Date(targetIso).getTime() - Date.now();
      setLabel(formatCountdown(remaining));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return <span className={`tabular ${className ?? ""}`}>{label}</span>;
}
