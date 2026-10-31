export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 md:col-span-2" />)}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40" />)}</div>
    </div>
  );
}
