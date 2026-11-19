export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="skeleton mb-5 h-5 w-40" />
      <div className="skeleton mb-6 h-28 w-full" />
      <div className="bento-grid">
        <div className="skeleton h-40 md:col-span-6" />
        <div className="skeleton h-80 md:col-span-4" />
        <div className="skeleton h-80 md:col-span-2" />
      </div>
    </div>
  );
}
