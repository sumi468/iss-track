"use client";

import { useMemo } from "react";
import type { LookAngles, PassPoint } from "@/types/iss";

interface SkyViewProps {
  track?: PassPoint[];
  live?: LookAngles | null;
  size?: number;
  compact?: boolean;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const MAX_R = SIZE / 2 - 28;

/** Project az/el onto the dome: center = zenith (90deg), edge = horizon (0deg). */
function project(azimuthDeg: number, elevationDeg: number) {
  const clampedEl = Math.max(0, elevationDeg);
  const r = MAX_R * ((90 - clampedEl) / 90);
  const rad = (azimuthDeg * Math.PI) / 180;
  return {
    x: CENTER + r * Math.sin(rad),
    y: CENTER - r * Math.cos(rad),
  };
}

export default function SkyView({ track = [], live, compact }: SkyViewProps) {
  const pathD = useMemo(() => {
    const visible = track.filter((p) => p.elevationDeg >= -1);
    if (visible.length < 2) return "";
    return visible
      .map((p, i) => {
        const { x, y } = project(p.azimuthDeg, p.elevationDeg);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [track]);

  const startPt = track[0] ? project(track[0].azimuthDeg, track[0].elevationDeg) : null;
  const endPt = track[track.length - 1]
    ? project(track[track.length - 1]!.azimuthDeg, track[track.length - 1]!.elevationDeg)
    : null;
  const livePt = live && live.elevationDeg > -2 ? project(live.azimuthDeg, live.elevationDeg) : null;

  const rings = [30, 60, 90];

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      height="100%"
      className="select-none"
      role="img"
      aria-label="Sky dome showing the ISS path"
    >
      <defs>
        <radialGradient id="domeBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#101830" />
          <stop offset="100%" stopColor="#070A15" />
        </radialGradient>
        <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B8CFF" />
          <stop offset="100%" stopColor="#8FE9FF" />
        </linearGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={MAX_R} fill="url(#domeBg)" stroke="rgba(255,255,255,0.08)" />

      {rings.map((el) => {
        const r = MAX_R * ((90 - el) / 90);
        return (
          <circle
            key={el}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeDasharray={el === 90 ? undefined : "2 5"}
          />
        );
      })}

      {!compact &&
        [0, 30, 60].map((el) => (
          <text
            key={el}
            x={CENTER + 4}
            y={CENTER - MAX_R * ((90 - el) / 90) - 4}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
          >
            {el}°
          </text>
        ))}

      {/* compass labels */}
      {[
        { label: "N", x: CENTER, y: CENTER - MAX_R - 12 },
        { label: "E", x: CENTER + MAX_R + 12, y: CENTER + 4 },
        { label: "S", x: CENTER, y: CENTER + MAX_R + 18 },
        { label: "W", x: CENTER - MAX_R - 12, y: CENTER + 4 },
      ].map((c) => (
        <text
          key={c.label}
          x={c.x}
          y={c.y}
          fontSize={compact ? 11 : 13}
          fontWeight={600}
          fill="rgba(140,220,255,0.7)"
          textAnchor="middle"
        >
          {c.label}
        </text>
      ))}

      {pathD && <path d={pathD} fill="none" stroke="url(#trackGrad)" strokeWidth={2.5} strokeLinecap="round" />}

      {startPt && <circle cx={startPt.x} cy={startPt.y} r={4} fill="#5B8CFF" />}
      {endPt && <circle cx={endPt.x} cy={endPt.y} r={4} fill="#8FE9FF" />}

      {livePt && (
        <g>
          <circle cx={livePt.x} cy={livePt.y} r={9} fill="#5CD8FF" opacity={0.25} className="animate-pulse-soft" />
          <circle cx={livePt.x} cy={livePt.y} r={4.5} fill="#F2F4FA" stroke="#5CD8FF" strokeWidth={1.5} />
        </g>
      )}
    </svg>
  );
}
