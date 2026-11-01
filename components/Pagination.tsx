import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  basePath = "/dashboard",
  pageKey = "page",
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath?: string;
  pageKey?: string;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    if (n > 1) p.set(pageKey, String(n));
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );
  const base = "glass grid h-9 min-w-9 place-items-center rounded-xl px-3 text-sm transition hover:border-brand/40";

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={base} aria-label="Previous page"><ChevronLeft className="size-4" /></Link>
      ) : (
        <span className={`${base} opacity-40`}><ChevronLeft className="size-4" /></span>
      )}
      {pages.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - pages[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-brand! border-brand! text-white!" : "text-muted"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={base} aria-label="Next page"><ChevronRight className="size-4" /></Link>
      ) : (
        <span className={`${base} opacity-40`}><ChevronRight className="size-4" /></span>
      )}
    </nav>
  );
}
