import Link from "next/link";
import { Activity } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-brand-2">
            <Activity className="size-4 text-white" />
          </span>
          API Health Engine
        </Link>
        <div className="glass-strong space-y-4 rounded-3xl p-7">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export function Alerts({ error, notice }: { error?: string | null; notice?: string | null }) {
  return (
    <>
      {error && <p role="alert" className="rounded-lg bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-healthy/10 px-3 py-2 text-sm text-healthy">{notice}</p>}
    </>
  );
}
