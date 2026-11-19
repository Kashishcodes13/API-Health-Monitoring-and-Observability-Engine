export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="skeleton h-10 w-60" />
      <div className="skeleton h-10 w-full max-w-xl" />
      <div className="skeleton h-130 w-full" />
    </div>
  );
}
