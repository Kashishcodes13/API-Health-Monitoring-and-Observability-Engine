import Link from "next/link";
import { Activity, ArrowRight, BellRing, History, Lock, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { Wave } from "@/components/Wave";

/** Decorative product preview. Pure illustration: no names, numbers or real data. */
function Preview() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl animate-fade-up [animation-delay:320ms]">
      <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-[radial-gradient(closest-side,rgb(244_63_94/0.16),transparent)]" />
      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-down/70" /><span className="size-2.5 rounded-full bg-degraded/70" /><span className="size-2.5 rounded-full bg-healthy/70" />
          <span className="ml-3 h-2 w-40 rounded-full bg-text/10" />
        </div>
        <div className="grid gap-0 sm:grid-cols-[150px_1fr]">
          <div className="hidden space-y-2 border-r border-line p-4 sm:block">
            <span className="block h-7 rounded-md bg-brand" />
            {[70, 55, 62].map((w) => <span key={w} className="block h-7 rounded-md bg-text/6" style={{ width: `${w + 30}%` }} />)}
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["text-healthy", "text-brand-2", "text-accent", "text-down"].map((c, i) => (
                <div key={i} className="rounded-lg border border-line bg-ink/50 p-3">
                  <span className={`status-dot ${c}`} />
                  <div className="mt-3 h-3 w-2/3 rounded bg-text/15" />
                  <div className="mt-2 h-2 w-1/2 rounded bg-text/8" />
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-line bg-ink/50 p-4">
              <svg viewBox="0 0 600 150" className="h-36 w-full" aria-hidden>
                <defs>
                  <linearGradient id="pv-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#60a5fa" stopOpacity=".35" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" /></linearGradient>
                </defs>
                {[40, 80, 120].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgba(148,163,184,.14)" strokeDasharray="3 6" />)}
                <path d="M0 105 C50 98 80 60 130 70 S210 120 260 92 S340 30 390 52 S480 92 530 60 S580 40 600 44 V150 H0Z" fill="url(#pv-a)" />
                <path d="M0 105 C50 98 80 60 130 70 S210 120 260 92 S340 30 390 52 S480 92 530 60 S580 40 600 44" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={1} className="animate-draw" />
                <path d="M0 125 C70 120 110 100 170 108 S280 128 340 112 S450 80 520 96 S580 88 600 90" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray={1} className="animate-draw [animation-delay:300ms]" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const steps = [
  { n: "01", t: "Add your API", d: "Paste a URL, pick the method and the status code you expect." },
  { n: "02", t: "We keep checking", d: "Every response is timed and judged: healthy, degraded or down." },
  { n: "03", t: "See the full story", d: "Live status, history charts and a timeline of every state change." },
];

const card = "glass bento-card";

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 font-bold">
          <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30"><Activity className="size-4" /></span>
          API Health Engine
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#features" className="hidden rounded-lg px-3.5 py-2 text-muted transition-colors hover:text-text sm:block">Features</a>
          <a href="#how" className="hidden rounded-lg px-3.5 py-2 text-muted transition-colors hover:text-text sm:block">How it works</a>
          <Link href="/login" className="rounded-lg px-3.5 py-2 text-muted transition-colors hover:text-text">Log in</Link>
          <Link href="/register" className="btn-primary ml-1 py-2!">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 pb-6 pt-14 text-center">
        <span className="label-mono animate-fade-up mb-6 inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-3 py-1.5 text-brand">
          <ShieldCheck className="size-3.5" /> Private by design · Real-time monitoring
        </span>
        <h1 className="animate-fade-up text-balance text-5xl font-bold leading-[1.05] tracking-tight [animation-delay:80ms] sm:text-7xl">
          Know your API is down <span className="text-gradient">before your users do.</span>
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted [animation-delay:160ms]">
          Uptime, latency and incident history for every endpoint you run, in one calm console that only you can see.
        </p>
        <div className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
          <Link href="/register" className="btn-primary group px-6! py-3!">
            Start monitoring free <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/login" className="btn-soft px-6! py-3!">Log in</Link>
        </div>
        <Preview />
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-5 pt-28">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to stay ahead</h2>
          <p className="mt-3 text-muted">Simple to set up, clear at a glance, and yours alone.</p>
        </div>
        <div className="bento-grid">
          <article className={`${card} md:col-span-4 md:row-span-2`}>
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-healthy/12 text-healthy"><Zap className="size-5" /></span>
            <h3 className="text-2xl font-bold tracking-tight">Live status, the moment it changes</h3>
            <p className="mt-2 max-w-md text-muted">Cards change colour as each check lands. No refreshing, no waiting for the next report.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[["text-healthy glow-healthy", "Healthy"], ["text-degraded glow-degraded", "Degraded"], ["text-down glow-down", "Down"]].map(([c, l]) => (
                <div key={l} className={`glass rounded-xl p-4 ${c}`}>
                  <span className="status-dot" />
                  <div className="mt-3 font-mono text-xs font-bold uppercase">{l}</div>
                  <div className="mt-3 h-2 w-2/3 rounded-full bg-text/10" />
                </div>
              ))}
            </div>
          </article>
          <article className={`${card} md:col-span-2`}>
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-brand-2/12 text-brand-2"><History className="size-5" /></span>
            <h3 className="font-semibold">History that remembers</h3>
            <p className="mt-1 text-sm text-muted">Browse 1 hour to 30 days of checks, with charts and a full execution log.</p>
          </article>
          <article className={`${card} md:col-span-2`}>
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-down/12 text-down"><BellRing className="size-5" /></span>
            <h3 className="font-semibold">Incident timeline</h3>
            <p className="mt-1 text-sm text-muted">Every switch between healthy, degraded and down is recorded with a time and a reason.</p>
          </article>
          <article className={`${card} md:col-span-2`}>
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-degraded/12 text-degraded"><RefreshCw className="size-5" /></span>
            <h3 className="font-semibold">Check on demand</h3>
            <p className="mt-1 text-sm text-muted">Probe any endpoint instantly, or let auto-monitor keep watch for you.</p>
          </article>
          <article className={`${card} md:col-span-2`}>
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-accent/12 text-accent"><Lock className="size-5" /></span>
            <h3 className="font-semibold">Private by design</h3>
            <p className="mt-1 text-sm text-muted">Sign-in is required. Each account sees only the endpoints it added, enforced in the database.</p>
          </article>
          <article className={`${card} md:col-span-2`}>
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-brand/12 text-brand"><ShieldCheck className="size-5" /></span>
            <h3 className="font-semibold">Simple sign-in</h3>
            <p className="mt-1 text-sm text-muted">Create an account with your email and a password. Forgot it? Reset it by email.</p>
          </article>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-5 pt-28">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl">Up and running in a minute</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="glass rounded-2xl p-6">
              <span className="font-mono text-sm font-bold text-brand">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-56 pt-28">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-10 text-center sm:p-14">
          <div aria-hidden className="absolute -right-20 -top-24 size-72 rounded-full bg-brand/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-16 size-72 rounded-full bg-brand-2/15 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Stop finding out from your users.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted">Create a free account and add your first API in under a minute.</p>
          <Link href="/register" className="btn-primary relative mt-8 px-7! py-3!">Create your account <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted">© {new Date().getFullYear()} API Health Engine</footer>
      <Wave />
    </main>
  );
}
