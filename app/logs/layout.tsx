import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/frontend/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  return <AppShell email={user.email ?? "Account"}>{children}</AppShell>;
}
