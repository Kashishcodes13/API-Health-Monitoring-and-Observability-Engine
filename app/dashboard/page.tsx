import type { Metadata } from "next";
import { requireUser } from "@/lib/frontend/auth";
import { loadBoardData } from "@/lib/frontend/data";
import { DashboardClient } from "@/components/DashboardClient";
import { AddServiceModal } from "@/components/AddServiceModal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const d = await loadBoardData(supabase);
  return (
    <>
      {d.loadError && (
        <p role="alert" className="mb-4 rounded-lg bg-down/10 px-4 py-3 text-sm text-down">Could not load data: {d.loadError}</p>
      )}
      <DashboardClient
        mode="overview"
        title="Dashboard"
        subtitle="Real-time performance metrics and live status for your APIs."
        addSlot={<AddServiceModal keys={d.keys} />}
        services={d.services}
        initialChecks={d.checks}
        serverNow={d.serverNow}
        initialQ=""
        initialPage={1}
      />
    </>
  );
}
