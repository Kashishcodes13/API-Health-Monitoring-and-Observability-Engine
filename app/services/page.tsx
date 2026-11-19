import type { Metadata } from "next";
import { requireUser } from "@/lib/frontend/auth";
import { loadBoardData } from "@/lib/frontend/data";
import { DashboardClient } from "@/components/DashboardClient";
import { AddServiceModal } from "@/components/AddServiceModal";

export const metadata: Metadata = { title: "API Services" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const d = await loadBoardData(supabase);
  return (
    <>
      {d.loadError && (
        <p role="alert" className="mb-4 rounded-lg bg-down/10 px-4 py-3 text-sm text-down">Could not load data: {d.loadError}</p>
      )}
      <DashboardClient
        mode="services"
        title="API Services"
        subtitle="Every endpoint you monitor. Search, filter and open any service for its full history."
        addSlot={<AddServiceModal keys={d.keys} />}
        services={d.services}
        initialChecks={d.checks}
        serverNow={d.serverNow}
        initialQ={(sp.q ?? "").slice(0, 60)}
        initialPage={Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1)}
      />
    </>
  );
}
