import Link from "next/link";
import { Activity, ArrowRight, BellRing, Gauge, Radio, ShieldCheck, Timer, Zap } from "lucide-react";
import { Wave } from "@/components/Wave";

const demo = [
  { name: "api.payments.io", ms: 142, tone: "healthy", label: "Healthy" },
  { name: "auth.service.dev", ms: 612, tone: "degraded", label: "Degraded" },
  { name: "cdn.assets.net", ms: 0, tone: "down", label: "Down" },
] as const;

const toneClass = {
  healthy: "text-healthy glow-healthy",
  degraded: "text-degraded glow-degraded",
  down: "text-down glow-down",
} as const;

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-linear-to-br from-brand to-brand-2">
            <Activity className="size-4 text-white" />
          </span>
          API Health Engine
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-xl px-4 py-2 text-muted transition hover:text-white">Log in</Link>
          <Link href="/register" className="glass rounded-xl px-4 py-2 transition hover:border-white/25">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 pb-16 pt-14 text-center">
        <span className="glass animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted">
          <span className="status-dot text-healthy" /> Live monitoring · Powered by Supabase Realtime
        </span>
        <h1 className="animate-fade-up text-balance text-5xl font-bold leading-[1.05] tracking-tight [animation-delay:80ms] sm:text-7xl">
          Know your API is down <span className="text-gradient">before your users do.</span>
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted [animation-delay:160ms]">
          Real-time uptime, latency and incident tracking for every endpoint you run, in one calm, glowing dashboard.
        </p>
        <div className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
          <Link href="/register" className="btn-primary group rounded-2xl px-6 py-3">
            Start monitoring free
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
          <Link href="/dashboard" className="glass rounded-2xl px-6 py-3 font-medium transition hover:border-white/25">
            View dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-48">
        <div className="bento-grid">
          <article className="glass-strong bento-card md:col-span-4 md:row-span-2">
            <div className="mb-5 flex items-center gap-2 text-sm text-muted">
              <Radio className="size-4 text-brand-2" /> Live status
            </div>
            <ul className="space-y-3">
              {demo.map((s) => (
                <li key={s.name} className={`glass flex items-center justify-between rounded-2xl px-4 py-3.5 ${toneClass[s.tone]}`}>
                  <span className="flex items-center gap-3">
                    <span className="status-dot" />
                    <span className="font-mono text-sm text-text">{s.name}</span>
                  </span>
                  <span className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-muted">{s.ms ? `${s.ms}ms` : "timeout"}</span>
                    <span className="font-medium">{s.label}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">
              Under 500 ms is healthy, 500 ms or more is degraded, and errors or a 5 s timeout mean down.
            </p>
          </article>

          <article className="glass bento-card md:col-span-2">
            <ShieldCheck className="mb-4 size-5 text-healthy" />
            <div className="text-4xl font-bold tracking-tight">99.98%</div>
            <p className="mt-1 text-sm text-muted">30-day uptime, per service</p>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className={`h-6 flex-1 rounded-sm ${i === 15 ? "bg-degraded" : "bg-healthy/80"}`} />
              ))}
            </div>
          </article>

          <article className="glass bento-card md:col-span-2">
            <Gauge className="mb-4 size-5 text-brand-2" />
            <div className="text-4xl font-bold tracking-tight">142<span className="text-xl text-muted">ms</span></div>
            <p className="text-sm text-muted">Median latency</p>
            <svg viewBox="0 0 200 50" className="mt-3 h-12 w-full" preserveAspectRatio="none">
              <path d="M0 38 L25 30 L50 34 L75 18 L100 24 L125 12 L150 20 L175 8 L200 14" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </article>

          <article className="glass bento-card md:col-span-2">
            <Zap className="mb-4 size-5 text-brand" />
            <h3 className="font-semibold">Realtime updates</h3>
            <p className="mt-1 text-sm text-muted">Cards update the moment a check lands. No refresh needed.</p>
          </article>
          <article className="glass bento-card md:col-span-2">
            <BellRing className="mb-4 size-5 text-down" />
            <h3 className="font-semibold">Incident timeline</h3>
            <p className="mt-1 text-sm text-muted">Every outage is tracked with start, end and duration.</p>
          </article>
          <article className="glass bento-card md:col-span-2">
            <Timer className="mb-4 size-5 text-degraded" />
            <h3 className="font-semibold">Check now</h3>
            <p className="mt-1 text-sm text-muted">Trigger an instant probe from the dashboard, any time.</p>
          </article>
        </div>
      </section>
      <Wave />
    </main>
  );
}
