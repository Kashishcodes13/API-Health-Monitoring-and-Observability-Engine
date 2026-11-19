export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-10 w-48" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-96 w-full" />
    </div>
  );
}
