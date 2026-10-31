const PERIOD = "c120 -60 240 -60 360 0 s240 60 360 0 ";
const PATH = `M0 80 ${PERIOD.repeat(4)}V200 H0 Z`;

const layers = [
  { cls: "animate-wave-slow", opacity: "opacity-30", from: "#6366f1", to: "#22d3ee", id: "w1", offset: "bottom-0 h-44" },
  { cls: "animate-wave-mid", opacity: "opacity-25", from: "#22d3ee", to: "#10b981", id: "w2", offset: "bottom-0 h-36" },
  { cls: "animate-wave-fast", opacity: "opacity-20", from: "#10b981", to: "#6366f1", id: "w3", offset: "bottom-0 h-28" },
];

export function Wave({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden ${className}`}>
      {layers.map((l) => (
        <svg key={l.id} viewBox="0 0 2880 200" preserveAspectRatio="none" className={`absolute w-[200%] ${l.offset} ${l.cls} ${l.opacity}`}>
          <defs>
            <linearGradient id={l.id} x1="0" x2="1">
              <stop offset="0%" stopColor={l.from} />
              <stop offset="100%" stopColor={l.to} />
            </linearGradient>
          </defs>
          <path d={PATH} fill={`url(#${l.id})`} />
        </svg>
      ))}
    </div>
  );
}
