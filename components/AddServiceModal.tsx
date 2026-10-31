"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
import { addServiceAction } from "@/lib/frontend/actions";

const METHODS = ["GET", "HEAD", "POST"];

export function AddServiceModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await addServiceAction({
        name: String(f.get("name") ?? "").trim(),
        url: String(f.get("url") ?? "").trim(),
        method: String(f.get("method") ?? "GET"),
        expected_status: Number(f.get("expected_status") ?? 200),
      });
      if (!res.ok) return setError(res.error ?? "Could not add service");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add service
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.form
              onSubmit={onSubmit}
              role="dialog"
              aria-modal="true"
              aria-label="Add service"
              className="glass-strong w-full max-w-md space-y-4 rounded-3xl p-6"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add a service</h2>
                <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-muted hover:text-white">
                  <X className="size-5" />
                </button>
              </div>
              <label className="block space-y-1.5 text-sm text-muted">
                Name
                <input name="name" required maxLength={80} placeholder="Payments API" className="input-glass" />
              </label>
              <label className="block space-y-1.5 text-sm text-muted">
                URL
                <input name="url" type="url" required placeholder="https://api.example.com/health" className="input-glass font-mono" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-sm text-muted">
                  Method
                  <select name="method" defaultValue="GET" className="input-glass">
                    {METHODS.map((m) => <option key={m} value={m} className="bg-ink-2">{m}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm text-muted">
                  Expected status
                  <input name="expected_status" type="number" min={100} max={599} defaultValue={200} required className="input-glass" />
                </label>
              </div>
              {error && <p role="alert" className="rounded-lg bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending && <Loader2 className="size-4 animate-spin" />} {pending ? "Adding…" : "Add service"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
