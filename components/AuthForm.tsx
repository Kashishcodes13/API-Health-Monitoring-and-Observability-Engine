"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setError(null); setNotice(null); setLoading(true);

    const supabase = createClient();
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/dashboard");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) { router.push("/dashboard"); router.refresh(); }
      else setNotice("Check your inbox to confirm your email, then log in.");
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-brand-2">
            <Activity className="size-4 text-white" />
          </span>
          API Health Engine
        </Link>
        <form onSubmit={onSubmit} className="glass-strong space-y-4 rounded-3xl p-7">
          <div>
            <h1 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-1 text-sm text-muted">{isLogin ? "Log in to see your dashboard." : "Start monitoring in under a minute."}</p>
          </div>
          <label className="block space-y-1.5 text-sm text-muted">
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="input-glass" />
          </label>
          <label className="block space-y-1.5 text-sm text-muted">
            Password
            <input name="password" type="password" required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="At least 8 characters" className="input-glass" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-healthy/10 px-3 py-2 text-sm text-healthy">{notice}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="size-4 animate-spin" />} {isLogin ? "Log in" : "Create account"}
          </button>
          <p className="text-center text-sm text-muted">
            {isLogin ? "No account? " : "Already registered? "}
            <Link href={isLogin ? "/register" : "/login"} className="text-brand-2 hover:underline">
              {isLogin ? "Register" : "Log in"}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
