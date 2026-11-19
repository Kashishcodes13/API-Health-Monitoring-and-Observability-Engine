import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="glass mx-auto mt-10 grid max-w-md place-items-center gap-3 rounded-xl px-8 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-brand/12 text-brand"><SearchX className="size-6" /></span>
      <h1 className="text-xl font-bold">Service not found</h1>
      <p className="text-sm text-muted">It may have been deleted, or it does not belong to your account.</p>
      <Link href="/services" className="btn-soft mt-2"><ArrowLeft className="size-4" /> Back to API Services</Link>
    </div>
  );
}
