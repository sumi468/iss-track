"use client";

import { useMemo } from "react";

/**
 * A deliberately sparse, slow-drifting starfield. The brief specifically
 * warns against "a wall of stars" — this renders ~70 small dots with a very
 * long, gentle drift animation so it reads as ambience, not decoration.
 */
export default function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() < 0.85 ? 1 : 2,
      opacity: 0.15 + Math.random() * 0.35,
      delay: Math.random() * 14,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* faint orbit arcs */}
      <svg
        className="absolute -top-1/4 left-1/2 -translate-x-1/2 opacity-[0.06]"
        width="1200"
        height="1200"
        viewBox="0 0 1200 1200"
      >
        <ellipse cx="600" cy="600" rx="560" ry="560" stroke="#8FE9FF" strokeWidth="1" fill="none" />
        <ellipse cx="600" cy="600" rx="420" ry="420" stroke="#8FE9FF" strokeWidth="1" fill="none" />
      </svg>

      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-drift"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${16 + s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
