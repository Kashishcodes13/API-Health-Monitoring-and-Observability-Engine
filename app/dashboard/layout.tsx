import Link from "next/link";
import { Activity, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16">
      <header className="flex items-center justify-between py-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-linear-to-br from-brand to-brand-2">
            <Activity className="size-4 text-white" />
          </span>
          API Health Engine
        </Link>
        <form action="/auth/signout" method="post">
          <button className="glass inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-muted transition hover:text-white">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
