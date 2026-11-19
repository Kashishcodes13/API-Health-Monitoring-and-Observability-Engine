const PERIOD = "c120 -60 240 -60 360 0 s240 60 360 0 ";
const PATH = `M0 80 ${PERIOD.repeat(4)}V200 H0 Z`;

const layers = [
  { cls: "animate-wave-slow", opacity: "opacity-20", from: "#f43f5e", to: "#60a5fa", id: "w1", offset: "bottom-0 h-44" },
  { cls: "animate-wave-mid", opacity: "opacity-15", from: "#60a5fa", to: "#a78bfa", id: "w2", offset: "bottom-0 h-36" },
  { cls: "animate-wave-fast", opacity: "opacity-10", from: "#a78bfa", to: "#f43f5e", id: "w3", offset: "bottom-0 h-28" },
];

export function Wave({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden ${className}`}>
      {layers.map((l) => (
        <svg key={l.id} viewBox="0 0 2880 200" preserveAspectRatio="none" className={`will-change-transform absolute w-[200%] ${l.offset} ${l.cls} ${l.opacity}`}>
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
