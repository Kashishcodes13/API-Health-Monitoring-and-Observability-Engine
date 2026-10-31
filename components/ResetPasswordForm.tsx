"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alerts, AuthShell } from "./AuthShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) return setError("Passwords do not match.");
    setError(null); setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    setNotice("Password updated. Redirecting…");
    setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1200);
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm text-muted">
          New password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input-glass" />
        </label>
        <label className="block space-y-1.5 text-sm text-muted">
          Confirm password
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input-glass" />
        </label>
        <Alerts error={error} notice={notice} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="size-4 animate-spin" />} Update password
        </button>
      </form>
    </AuthShell>
  );
}
