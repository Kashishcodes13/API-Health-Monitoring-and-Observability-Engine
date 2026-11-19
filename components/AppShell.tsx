"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, LogOut, Menu, ScrollText, Search, Server, TriangleAlert } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/services", label: "API Services", Icon: Server },
  { href: "/incidents", label: "Incidents", Icon: TriangleAlert },
  { href: "/logs", label: "Execution Logs", Icon: ScrollText },
];

export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid size-8 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30">
          <Activity className="size-4" />
        </span>
        <span className="text-[15px] font-bold tracking-tight">API Health Engine</span>
      </Link>
      <nav className="flex-1 px-3 py-2" aria-label="Main">
        <div className="label-mono px-2 pb-2">Navigation</div>
        <ul className="space-y-1">
          {NAV.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active(href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active(href) ? "bg-brand text-white shadow-lg shadow-brand/25" : "text-muted hover:bg-text/5 hover:text-text"
                }`}
              >
                <Icon className="size-4" /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-accent text-xs font-bold uppercase text-white">
            {email[0] ?? "?"}
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{email}</div>
            <div className="label-mono">Account</div>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-text/5 hover:text-text">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-ink-2/80 lg:block">{sidebar}</aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 w-64 border-r border-line bg-ink-2 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          {sidebar}
        </aside>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ink/85 px-4 py-3 backdrop-blur-md sm:px-6">
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted transition-colors hover:bg-text/5 lg:hidden">
            <Menu className="size-5" />
          </button>
          <form
            role="search"
            className="relative max-w-xl flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const v = q.trim();
              router.push(v ? `/services?q=${encodeURIComponent(v)}` : "/services");
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your APIs by name or URL…"
              aria-label="Search services"
              className="input-glass pl-9"
            />
          </form>
        </header>
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6">
          <div key={pathname} className="animate-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
