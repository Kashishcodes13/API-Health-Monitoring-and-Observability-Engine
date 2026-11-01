import Link from "next/link";
import { Activity, LogOut } from "lucide-react";
import { requireUser } from "@/lib/frontend/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  const email = user.email ?? "Account";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16">
      <header className="flex items-center justify-between py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand via-accent to-brand-2 shadow-md shadow-brand/30">
            <Activity className="size-4 text-white" />
          </span>
          API Health Engine
        </Link>
        <div className="flex items-center gap-2">
          <span className="glass hidden items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm sm:inline-flex">
            <span className="grid size-7 place-items-center rounded-full bg-linear-to-br from-brand to-brand-2 text-xs font-bold uppercase text-white">
              {email[0]}
            </span>
            <span className="max-w-48 truncate text-muted">{email}</span>
          </span>
          <form action="/auth/signout" method="post">
            <button className="glass inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-muted transition hover:text-text">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
