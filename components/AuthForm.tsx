"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alerts, AuthShell } from "./AuthShell";

export function AuthForm({ mode, authError = false }: { mode: "login" | "register"; authError?: boolean }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [error, setError] = useState<string | null>(authError ? "Sign-in failed or the link expired. Please try again." : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

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
      subtitle={isLogin ? "Sign in to continue monitoring your endpoints." : "Get started for free. Add your first API in under a minute."}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="label-mono">Email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="input-glass pl-9" />
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="flex items-center justify-between">
            <span className="label-mono">Password</span>
            {isLogin && <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">Forgot password?</Link>}
          </span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="password" type={show ? "text" : "password"} required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="At least 8 characters" className="input-glass pl-9 pr-10" />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:text-text">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </label>
        {!isLogin && (
          <label className="block space-y-1.5">
            <span className="label-mono">Confirm password</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input name="confirm" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="Repeat your password" className="input-glass pl-9" />
            </span>
          </label>
        )}
        <Alerts error={error} notice={notice} />
        <button type="submit" disabled={loading} className="btn-primary w-full py-3!">
          {loading && <Loader2 className="size-4 animate-spin" />} {isLogin ? "Sign in to dashboard" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {isLogin ? "No account? " : "Already registered? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-semibold text-brand hover:underline">{isLogin ? "Create account" : "Sign in"}</Link>
      </p>
    </AuthShell>
  );
}
