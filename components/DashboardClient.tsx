"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Search, ServerOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeCheck } from "@/lib/frontend/status";
import type { CheckRow, ServiceRow, Status } from "@/lib/frontend/types";
import { StatusCard } from "./StatusCard";

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "healthy", label: "Healthy" },
  { key: "degraded", label: "Degraded" },
  { key: "down", label: "Down" },
];

export function DashboardClient({
  services,
  latest,
  q,
}: {
  services: ServiceRow[];
  latest: Record<string, CheckRow>;
  q: string;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState(latest);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState(q);
  const [live, setLive] = useState(false);
  const ids = useMemo(() => new Set(services.map((s) => s.id)), [services]);
  const idsRef = useRef(ids);

  useEffect(() => setChecks(latest), [latest]);
  useEffect(() => { idsRef.current = ids; }, [ids]);

  // Realtime: new health checks update cards instantly; service changes refresh the page data.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "health_checks" }, (payload) => {
        const row = normalizeCheck(payload.new);
        if (idsRef.current.has(row.service_id)) setChecks((prev) => ({ ...prev, [row.service_id]: row }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => router.refresh())
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Debounced server-side search (resets to page 1).
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (query.trim()) p.set("q", query.trim());
      router.replace(p.toString() ? `/dashboard?${p}` : "/dashboard");
    }, 350);
    return () => clearTimeout(t);
  }, [query, q, router]);

  const visible = services.filter((s) => filter === "all" || checks[s.id]?.status === filter);

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or URL…"
            aria-label="Search services"
            className="input-glass pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="glass flex rounded-2xl p-1" role="tablist" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-xl px-3 py-1.5 text-xs transition ${filter === f.key ? "bg-white/12 text-white" : "text-muted hover:text-white"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className={`flex items-center gap-1.5 text-xs ${live ? "text-healthy" : "text-muted"}`} title="Realtime connection">
            <span className={live ? "status-dot" : "inline-block size-2 rounded-full bg-muted"} /> {live ? "Live" : "Connecting"}
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="glass grid place-items-center gap-3 rounded-3xl py-16 text-center text-muted">
          <ServerOff className="size-8" />
          <p>{services.length === 0 ? "No services yet. Add your first one." : "No services match this filter on this page."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((s) => <StatusCard key={s.id} service={s} check={checks[s.id]} />)}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
