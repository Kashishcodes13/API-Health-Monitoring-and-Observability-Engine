"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alerts, AuthShell } from "./AuthShell";

export function AuthForm({ mode, authError = false }: { mode: "login" | "register"; authError?: boolean }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [error, setError] = useState<string | null>(authError ? "Sign-in failed or the link expired. Please try again." : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setError(null); setNotice(null);

    if (!isLogin && password !== String(f.get("confirm"))) return setError("Passwords do not match.");

    setLoading(true);
    const supabase = createClient();
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/dashboard");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard` },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) { router.push("/dashboard"); router.refresh(); }
      else setNotice("Check your inbox to confirm your email, then log in.");
    }
  }

  return (
    <AuthShell
      title={isLogin ? "Welcome back" : "Create your account"}
      subtitle={isLogin ? "Log in to see your dashboard." : "Start monitoring in under a minute."}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm text-muted">
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@gmail.com" className="input-glass" />
        </label>
        <label className="block space-y-1.5 text-sm text-muted">
          <span className="flex items-center justify-between">
            Password
            {isLogin && <Link href="/forgot-password" className="text-xs text-brand-2 hover:underline">Forgot password?</Link>}
          </span>
          <input name="password" type="password" required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="At least 8 characters" className="input-glass" />
        </label>
        {!isLogin && (
          <label className="block space-y-1.5 text-sm text-muted">
            Confirm password
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" placeholder="Repeat your password" className="input-glass" />
          </label>
        )}
        <Alerts error={error} notice={notice} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="size-4 animate-spin" />} {isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {isLogin ? "No account? " : "Already registered? "}
        <Link href={isLogin ? "/register" : "/login"} className="text-brand-2 hover:underline">{isLogin ? "Register" : "Log in"}</Link>
      </p>
    </AuthShell>
  );
}
