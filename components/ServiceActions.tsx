"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { deleteServiceAction, toggleServiceAction } from "@/lib/frontend/actions";
import { CheckNowButton } from "./CheckNowButton";

export function ServiceActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const btn = "glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition hover:text-text disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CheckNowButton serviceId={id} label />
      <button
        disabled={pending}
        className={`${btn} text-muted`}
        onClick={() => start(async () => { await toggleServiceAction(id, !active); router.refresh(); })}
      >
        {active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} {active ? "Pause" : "Resume"}
      </button>
      <button
        disabled={pending}
        className={`${btn} text-down`}
        onClick={() => {
          if (!confirm("Delete this service and its history?")) return;
          start(async () => {
            const r = await deleteServiceAction(id);
            if (r.ok) router.push("/dashboard");
          });
        }}
      >
        <Trash2 className="size-3.5" /> Delete
      </button>
    </div>
  );
}
