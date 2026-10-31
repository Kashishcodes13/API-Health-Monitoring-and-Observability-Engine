"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alerts, AuthShell } from "./AuthShell";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setError(null); setNotice(null); setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setNotice("If an account exists for that email, a reset link is on its way. Open it in this same browser.");
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm text-muted">
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@gmail.com" className="input-glass" />
        </label>
        <Alerts error={error} notice={notice} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="size-4 animate-spin" />} Send reset link
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-brand-2 hover:underline">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
