import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Claims = { sub?: string; email?: string };

/**
 * ONE sign-in lookup per request (React cache), shared by the layout and the page.
 * getClaims() verifies the session token: locally with your project's signing keys when it can
 * (no network round trip), and through the Supabase auth server otherwise. It never just trusts a cookie.
 */
export const getAuth = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const c = (data?.claims ?? null) as Claims | null;
  if (error || !c?.sub) return { supabase, user: null };
  return { supabase, user: { id: c.sub, email: c.email ?? null } };
});

/** Call at the top of every protected page: layouts and pages render independently. */
export async function requireUser() {
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");
  return { supabase, user };
}
