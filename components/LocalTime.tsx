"use client";
/** Renders a timestamp in the viewer's own timezone. */
export function LocalTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString()}
    </time>
  );
}
