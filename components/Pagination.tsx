import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function href(page: number, q: string) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/dashboard?${s}` : "/dashboard";
}

export function Pagination({ page, totalPages, q }: { page: number; totalPages: number; q: string }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );
  const base = "glass grid h-9 min-w-9 place-items-center rounded-xl px-3 text-sm transition hover:border-white/25";

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1, q)} className={base} aria-label="Previous page"><ChevronLeft className="size-4" /></Link>
      ) : (
        <span className={`${base} opacity-40`}><ChevronLeft className="size-4" /></span>
      )}
      {pages.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - pages[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link
            href={href(n, q)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-brand/30! border-brand/60! text-white" : "text-muted"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1, q)} className={base} aria-label="Next page"><ChevronRight className="size-4" /></Link>
      ) : (
        <span className={`${base} opacity-40`}><ChevronRight className="size-4" /></span>
      )}
    </nav>
  );
}
