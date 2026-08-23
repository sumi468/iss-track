"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/sky", label: "Sky", icon: SkyIcon },
  { href: "/iss", label: "ISS", icon: OrbitIcon },
  { href: "/passes", label: "Passes", icon: ListIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav className="safe-bottom md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3">
        <div className="glass-panel flex items-stretch justify-between px-1 py-1.5">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-colors ${
                  active ? "text-cyan" : "text-white/45"
                }`}
              >
                <Icon active={active} />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col p-6 z-40">
        <div className="mb-10 flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">ISSCOPE</span>
        </div>
        <div className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                  active ? "bg-white/8 text-cyan" : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon active={active} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function iconProps(active?: boolean) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: active ? "#5CD8FF" : "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}
function SkyIcon({ active }: { active?: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill={active ? "#5CD8FF" : "currentColor"} />
    </svg>
  );
}
function OrbitIcon({ active }: { active?: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <ellipse cx="12" cy="12" rx="9" ry="4" />
      <circle cx="18" cy="9" r="1.6" fill={active ? "#5CD8FF" : "currentColor"} />
    </svg>
  );
}
function ListIcon({ active }: { active?: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M8 6h11" />
      <path d="M8 12h11" />
      <path d="M8 18h11" />
      <circle cx="4" cy="6" r="1" fill={active ? "#5CD8FF" : "currentColor"} />
      <circle cx="4" cy="12" r="1" fill={active ? "#5CD8FF" : "currentColor"} />
      <circle cx="4" cy="18" r="1" fill={active ? "#5CD8FF" : "currentColor"} />
    </svg>
  );
}
function GearIcon({ active }: { active?: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.8-1.4-2-3.4-2.1.6a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.1-.6-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.8 15l2 3.4 2.1-.6a7.6 7.6 0 0 0 2.6 1.5L10 21.5h4l.5-2.3a7.6 7.6 0 0 0 2.6-1.5l2.1.6 2-3.4-1.8-1.4Z" />
    </svg>
  );
}
