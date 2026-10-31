import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizeCheck } from "@/lib/frontend/status";
import type { CheckRow, ServiceRow } from "@/lib/frontend/types";
import { StatsBento } from "@/components/StatsBento";
import { DashboardClient } from "@/components/DashboardClient";
import { Pagination } from "@/components/Pagination";
import { AddServiceModal } from "@/components/AddServiceModal";

export const metadata: Metadata = { title: "Dashboard" };
const PAGE_SIZE = 9;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  // strip characters that have meaning inside PostgREST filter strings
  const q = (sp.q ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("services")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,url.ilike.%${q}%`);

  const [{ data, count }, { data: stats }] = await Promise.all([query, supabase.rpc("dashboard_stats")]);
  const services = (data ?? []) as ServiceRow[];

  // latest check per service on this page
  const latest: Record<string, CheckRow> = {};
  await Promise.all(
    services.map(async (s) => {
      const { data: rows } = await supabase
        .from("health_checks")
        .select("*")
        .eq("service_id", s.id)
        .order("checked_at", { ascending: false })
        .limit(1);
      if (rows?.[0]) latest[s.id] = normalizeCheck(rows[0]);
    }),
  );

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Live status of every endpoint you monitor.</p>
        </div>
        <AddServiceModal />
      </div>

      <StatsBento stats={stats} />
      <DashboardClient services={services} latest={latest} q={q} />
      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} q={q} />
      <p className="mt-4 text-center text-xs text-muted">
        {count ?? 0} service{count === 1 ? "" : "s"} · page {Math.min(page, totalPages)} of {totalPages}
      </p>
    </main>
  );
}
