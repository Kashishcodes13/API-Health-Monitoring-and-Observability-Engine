"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const Google = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.4 7.3 24 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
);
const GitHub = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.500 11.500 0 0 1 6 0c2.300-1.500 3.300-1.200 3.300-1.200.7 1.700.2 2.900.1 3.200.8.800 1.200 1.900 1.200 3.200 0 4.600-2.800 5.600-5.500 5.900.4.400.8 1.100.8 2.200v3.300c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
  </svg>
);

export function OAuthButtons({ onError, verb }: { onError: (m: string) => void; verb: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function go(provider: "google" | "github") {
    setBusy(provider);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) { onError(error.message); setBusy(null); }
  }

  const btn = "glass inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:border-white/25 disabled:opacity-60";
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <button type="button" disabled={!!busy} onClick={() => go("google")} className={btn}>
        {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : <Google />} {verb} with Google
      </button>
      <button type="button" disabled={!!busy} onClick={() => go("github")} className={btn}>
        {busy === "github" ? <Loader2 className="size-4 animate-spin" /> : <GitHub />} {verb} with GitHub
      </button>
    </div>
  );
}
