"use client";

import { useEffect, useRef, useState } from "react";
import type { SatRec } from "@/lib/satellite";
import { toISSPosition } from "@/lib/satellite";
import { subsolarPoint } from "@/lib/astronomy";
import type { ObserverLocation } from "@/types/iss";

interface ISSMapProps {
  satrec: SatRec | null;
  observer: ObserverLocation;
  now: Date;
}

const SHADE_W = 240;
const SHADE_H = 120;

function lonLatToXY(lon: number, lat: number, w: number, h: number) {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

export default function ISSMap({ satrec, observer, now }: ISSMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dims, setDims] = useState({ w: 600, h: 300 });
  const [groundTrack, setGroundTrack] = useState<{ x: number; y: number }[][]>([]);

  // Day/night shading, redrawn periodically (not every second — it barely moves).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { latitude: latS, longitude: lonS } = subsolarPoint(now);
    const latSRad = (latS * Math.PI) / 180;

    const img = ctx.createImageData(SHADE_W, SHADE_H);
    for (let py = 0; py < SHADE_H; py++) {
      const lat = 90 - (py / SHADE_H) * 180;
      const latRad = (lat * Math.PI) / 180;
      for (let px = 0; px < SHADE_W; px++) {
        const lon = (px / SHADE_W) * 360 - 180;
        const H = ((lon - lonS) * Math.PI) / 180;
        const cosZ = Math.sin(latRad) * Math.sin(latSRad) + Math.cos(latRad) * Math.cos(latSRad) * Math.cos(H);
        const idx = (py * SHADE_W + px) * 4;
        if (cosZ < 0) {
          // night side: soft dark-navy overlay, deeper as sun gets further below horizon
          const depth = Math.min(1, -cosZ * 2.2);
          img.data[idx] = 3;
          img.data[idx + 1] = 6;
          img.data[idx + 2] = 16;
          img.data[idx + 3] = Math.round(120 * depth + 40);
        } else {
          img.data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [now]);

  // Ground track: +/- 45 min around now, split into segments across the antimeridian.
  useEffect(() => {
    if (!satrec) return;
    const points: { lon: number; lat: number }[] = [];
    for (let m = -45; m <= 45; m += 2) {
      const t = new Date(now.getTime() + m * 60000);
      const pos = toISSPosition(satrec, t);
      if (pos) points.push({ lon: pos.longitude, lat: pos.latitude });
    }
    const segments: { x: number; y: number }[][] = [[]];
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      const seg = segments[segments.length - 1]!;
      if (seg.length > 0) {
        const prevX = seg[seg.length - 1]!.x;
        const { x } = lonLatToXY(p.lon, p.lat, dims.w, dims.h);
        if (Math.abs(x - prevX) > dims.w / 2) segments.push([]);
      }
      const xy = lonLatToXY(p.lon, p.lat, dims.w, dims.h);
      segments[segments.length - 1]!.push(xy);
    }
    setGroundTrack(segments);
  }, [satrec, now, dims]);

  const issPos = satrec ? toISSPosition(satrec, now) : null;
  const issXY = issPos ? lonLatToXY(issPos.longitude, issPos.latitude, dims.w, dims.h) : null;
  const obsXY = lonLatToXY(observer.longitude, observer.latitude, dims.w, dims.h);

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-white/8"
      style={{ aspectRatio: "2 / 1" }}
      ref={(el) => {
        if (el && (el.clientWidth !== dims.w || el.clientHeight !== dims.h)) {
          setDims({ w: el.clientWidth, h: el.clientHeight });
        }
      }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#0B1020,#070A15)" }} />

      {/* graticule */}
      <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="absolute inset-0 w-full h-full">
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={(dims.w / 12) * (i + 1)}
            y1={0}
            x2={(dims.w / 12) * (i + 1)}
            y2={dims.h}
            stroke="rgba(255,255,255,0.05)"
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={(dims.h / 6) * (i + 1)}
            x2={dims.w}
            y2={(dims.h / 6) * (i + 1)}
            stroke="rgba(255,255,255,0.05)"
          />
        ))}
        <line x1={0} y1={dims.h / 2} x2={dims.w} y2={dims.h / 2} stroke="rgba(255,255,255,0.12)" />
      </svg>

      <canvas
        ref={canvasRef}
        width={SHADE_W}
        height={SHADE_H}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />

      <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="absolute inset-0 w-full h-full">
        {groundTrack.map((seg, i) => (
          <polyline
            key={i}
            points={seg.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#5CD8FF"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="1 4"
          />
        ))}

        <g transform={`translate(${obsXY.x},${obsXY.y})`}>
          <circle r={5} fill="none" stroke="#8FE9FF" strokeWidth={1.5} />
          <circle r={1.6} fill="#8FE9FF" />
        </g>

        {issXY && (
          <g transform={`translate(${issXY.x},${issXY.y})`}>
            <circle r={9} fill="#5CD8FF" opacity={0.25} className="animate-pulse-soft" />
            <circle r={4} fill="#F2F4FA" stroke="#5CD8FF" strokeWidth={1.5} />
          </g>
        )}
      </svg>
    </div>
  );
}
