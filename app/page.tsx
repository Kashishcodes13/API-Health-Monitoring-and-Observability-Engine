import Link from "next/link";
import {
  Activity, ArrowRight, BellRing, History, Lock, RefreshCw, ShieldCheck, Sparkles, Zap,
} from "lucide-react";
import { Wave } from "@/components/Wave";

/** Decorative product preview. Pure illustration: no names, numbers or real data. */
function Preview() {
  const rows = [
    { c: "text-healthy glow-healthy", w: "w-28" },
    { c: "text-degraded glow-degraded", w: "w-20" },
    { c: "text-healthy glow-healthy", w: "w-32" },
    { c: "text-down glow-down", w: "w-24" },
  ];
  return (
    <div className="relative mx-auto mt-16 max-w-3xl animate-fade-up [animation-delay:320ms]">
      <span className="glass animate-float absolute -left-3 -top-5 z-10 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-healthy sm:inline-flex">
        <span className="status-dot" /> Healthy
      </span>
      <span className="glass animate-float-slow absolute -right-2 top-10 z-10 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-degraded sm:inline-flex">
        <span className="status-dot" /> Degraded
      </span>
      <span className="glass animate-float absolute -bottom-4 left-10 z-10 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-down sm:inline-flex">
        <span className="status-dot" /> Down
      </span>

      <div className="glass-strong rounded-[2rem] p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-down/70" />
          <span className="size-2.5 rounded-full bg-degraded/70" />
          <span className="size-2.5 rounded-full bg-healthy/70" />
          <span className="ml-3 h-2.5 w-28 rounded-full bg-text/8" />
        </div>
        <div className="grid gap-5 sm:grid-cols-5">
          <ul className="space-y-3 sm:col-span-2">
            {rows.map((r, i) => (
              <li key={i} className={`glass flex items-center gap-3 rounded-2xl px-4 py-3 ${r.c}`}>
                <span className="status-dot" />
                <span className={`h-2.5 ${r.w} rounded-full bg-text/12`} />
                <span className="ml-auto h-2 w-8 rounded-full bg-text/8" />
              </li>
            ))}
          </ul>
          <div className="glass rounded-2xl p-4 sm:col-span-3">
            <div className="mb-3 flex gap-2"><span className="h-2.5 w-20 rounded-full bg-text/10" /><span className="h-2.5 w-12 rounded-full bg-text/8" /></div>
            <svg viewBox="0 0 300 130" className="h-40 w-full" aria-hidden>
              <defs>
                <linearGradient id="pv-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="pv-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              {[30, 65, 100].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(15,23,42,0.07)" strokeDasharray="3 6" />)}
              <path d="M0 96 C25 88 40 60 70 66 S115 104 145 78 S190 30 220 46 S270 70 300 34 V130 H0 Z" fill="url(#pv-fill)" />
              <path d="M0 96 C25 88 40 60 70 66 S115 104 145 78 S190 30 220 46 S270 70 300 34" fill="none" stroke="url(#pv-line)"
                strokeWidth="3.5" strokeLinecap="round" pathLength={1} strokeDasharray={1} className="animate-draw" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

const steps = [
  { n: "1", t: "Add your API", d: "Paste a URL, pick the method and the status code you expect." },
  { n: "2", t: "We keep checking", d: "Every response is timed and judged: healthy, degraded or down." },
  { n: "3", t: "See the full story", d: "Live status, history charts and a timeline of every state change." },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand via-accent to-brand-2 shadow-md shadow-brand/30">
            <Activity className="size-4 text-white" />
          </span>
          API Health Engine
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#features" className="hidden rounded-xl px-3.5 py-2 text-muted transition hover:text-text sm:block">Features</a>
          <a href="#how" className="hidden rounded-xl px-3.5 py-2 text-muted transition hover:text-text sm:block">How it works</a>
          <Link href="/login" className="rounded-xl px-3.5 py-2 text-muted transition hover:text-text">Log in</Link>
          <Link href="/register" className="btn-primary ml-1 py-2!">Get started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pb-6 pt-14 text-center">
        <span className="glass animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted">
          <Sparkles className="size-3.5 text-accent" /> Private by design · Real-time monitoring
        </span>
        <h1 className="animate-fade-up text-balance text-5xl font-bold leading-[1.05] tracking-tight [animation-delay:80ms] sm:text-7xl">
          Know your API is down <span className="text-gradient">before your users do.</span>
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted [animation-delay:160ms]">
          Uptime, latency and incident history for every endpoint you run, in one calm dashboard that only you can see.
        </p>
        <div className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
          <Link href="/register" className="btn-primary group px-6! py-3!">
            Start monitoring free
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
          <Link href="/login" className="btn-soft px-6! py-3!">Log in</Link>
        </div>
        <Preview />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-5 pt-28">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to stay ahead</h2>
          <p className="mt-3 text-muted">Simple to set up, clear at a glance, and yours alone.</p>
        </div>
        <div className="bento-grid">
          <article className="glass-strong bento-card md:col-span-4 md:row-span-2">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-healthy/10 text-healthy"><Zap className="size-5" /></span>
            <h3 className="text-2xl font-bold tracking-tight">Live status, the moment it changes</h3>
            <p className="mt-2 max-w-md text-muted">
              Cards glow emerald, amber or rose as each check lands. No refreshing, no waiting for the next report.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[["text-healthy glow-healthy", "Healthy"], ["text-degraded glow-degraded", "Degraded"], ["text-down glow-down", "Down"]].map(([c, l]) => (
                <div key={l} className={`glass rounded-2xl p-4 ${c}`}>
                  <span className="status-dot" />
                  <div className="mt-3 text-sm font-semibold">{l}</div>
                  <div className="mt-3 h-2 w-2/3 rounded-full bg-text/10" />
                </div>
              ))}
            </div>
          </article>

          <article className="glass bento-card md:col-span-2">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand"><History className="size-5" /></span>
            <h3 className="font-semibold">History that remembers</h3>
            <p className="mt-1 text-sm text-muted">Browse 24 hours, 7 days or 30 days of checks, with charts and a full check log.</p>
          </article>
          <article className="glass bento-card md:col-span-2">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-down/10 text-down"><BellRing className="size-5" /></span>
            <h3 className="font-semibold">Incident timeline</h3>
            <p className="mt-1 text-sm text-muted">Every switch between healthy, degraded and down is recorded with a time and reason.</p>
          </article>
          <article className="glass bento-card md:col-span-2">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-degraded/10 text-degraded"><RefreshCw className="size-5" /></span>
            <h3 className="font-semibold">Check on demand</h3>
            <p className="mt-1 text-sm text-muted">Probe any endpoint instantly, or let auto-monitor keep watch for you.</p>
          </article>
          <article className="glass bento-card md:col-span-2">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><Lock className="size-5" /></span>
            <h3 className="font-semibold">Private by design</h3>
            <p className="mt-1 text-sm text-muted">Sign-in is required. Each account sees only the endpoints it added, enforced in the database.</p>
          </article>
          <article className="glass bento-card md:col-span-2">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-brand-2/10 text-brand-2"><ShieldCheck className="size-5" /></span>
            <h3 className="font-semibold">Simple sign-in</h3>
            <p className="mt-1 text-sm text-muted">Create an account with your email and a password. Forgot it? Reset it by email.</p>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-5 pt-28">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Up and running in a minute</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="glass rounded-3xl p-6">
              <span className="grid size-10 place-items-center rounded-full bg-linear-to-br from-brand to-brand-2 text-sm font-bold text-white shadow-md shadow-brand/25">{s.n}</span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-56 pt-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-brand via-accent to-brand-2 p-10 text-center text-white shadow-2xl shadow-brand/30 sm:p-14">
          <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/15 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 -left-10 size-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Stop finding out from your users.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">Create a free account and add your first API in under a minute.</p>
          <Link href="/register" className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3 font-semibold text-brand shadow-lg transition hover:-translate-y-0.5">
            Create your account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted">© {new Date().getFullYear()} API Health Engine</footer>
      <Wave />
    </main>
  );
}
