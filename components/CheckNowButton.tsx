"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { checkNowAction } from "@/lib/frontend/actions";

export function CheckNowButton({ serviceId, label = false }: { serviceId: string; label?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Check now"
      title="Check now"
      onClick={() =>
        start(async () => {
          await checkNowAction(serviceId);
          router.refresh();
        })
      }
      className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-muted transition hover:text-text disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      {label && (pending ? "Checking…" : "Check now")}
    </button>
  );
}
