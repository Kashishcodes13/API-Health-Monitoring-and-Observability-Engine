import Link from "next/link";
import { Activity, BellRing, History, Lock, Zap } from "lucide-react";

const points = [
  { Icon: Zap, t: "Live status", d: "Results stream to your dashboard the moment a check lands." },
  { Icon: History, t: "History and incidents", d: "24 hours to 30 days of latency, plus every state change." },
  { Icon: Lock, t: "Private by design", d: "Row-level security keeps your APIs invisible to everyone else." },
];

/** Decorative network graphic (illustration only: no real data). */
function Mesh() {
  const nodes = [
    { x: 70, y: 40, c: "#22c55e" }, { x: 330, y: 52, c: "#22c55e" }, { x: 36, y: 150, c: "#f59e0b" },
    { x: 364, y: 150, c: "#22c55e" }, { x: 110, y: 236, c: "#22c55e" }, { x: 290, y: 232, c: "#ef4444" },
  ];
  return (
    <svg viewBox="0 0 400 270" className="h-auto w-full" aria-hidden>
      {nodes.map((n, i) => (
        <line key={i} x1="200" y1="140" x2={n.x} y2={n.y} stroke={n.c} strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="5 5" className={n.c === "#ef4444" ? undefined : "animate-flow"} />
      ))}
      {nodes.map((n, i) => (
        <g key={i}><circle cx={n.x} cy={n.y} r="9" fill="#0d1426" stroke={n.c} strokeWidth="2.5" /><circle cx={n.x} cy={n.y} r="3" fill={n.c} /></g>
      ))}
      <circle cx="200" cy="140" r="34" fill="none" stroke="rgba(244,63,94,0.18)" />
      <circle cx="200" cy="140" r="26" fill="#121b31" stroke="rgba(244,63,94,0.6)" strokeWidth="2" />
      <text x="200" y="144" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e6ebf7" fontFamily="Inter, sans-serif">PROBE</text>
    </svg>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-ink-2/60 p-10 lg:flex">
        <Link href="/" className="flex w-fit items-center gap-2.5 font-bold">
          <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30"><Activity className="size-4" /></span>
          API Health Engine
        </Link>
        <div className="max-w-lg">
          <span className="label-mono inline-flex items-center gap-2 rounded-md bg-brand/10 px-2.5 py-1 text-brand"><BellRing className="size-3" /> Real-time API monitoring</span>
          <h2 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight">
            Know your API is down <span className="text-gradient">before your users do.</span>
          </h2>
          <p className="mt-4 text-muted">Add the endpoints you depend on and watch their health, latency and incidents in one calm console.</p>
          <div className="mt-8 rounded-xl border border-line bg-ink/50 p-4"><Mesh /></div>
          <ul className="mt-8 space-y-4">
            {points.map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-text/6 text-brand-2"><Icon className="size-4" /></span>
                <div><div className="text-sm font-semibold">{t}</div><div className="text-sm text-muted">{d}</div></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="label-mono">Email and password sign-in · Sessions verified on every request</p>
      </section>

      <section className="grid place-items-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 font-bold lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30"><Activity className="size-4" /></span>
            API Health Engine
          </Link>
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export function Alerts({ error, notice }: { error?: string | null; notice?: string | null }) {
  return (
    <>
      {error && <p role="alert" className="rounded-lg bg-down/12 px-3 py-2 text-sm text-down">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-healthy/12 px-3 py-2 text-sm text-healthy">{notice}</p>}
    </>
  );
}
