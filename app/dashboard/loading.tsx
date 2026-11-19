export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)}</div>
      <div className="grid gap-4 xl:grid-cols-3"><div className="skeleton h-96 xl:col-span-2" /><div className="skeleton h-96" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-44" />)}</div>
    </div>
  );
}
