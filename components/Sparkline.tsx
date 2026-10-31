/** Tiny inline latency trend. Gaps (null) are failed checks, drawn as red ticks. */
export function Sparkline({
  values,
  color = "#22d3ee",
  className = "h-8 w-full",
}: {
  values: (number | null)[];
  color?: string;
  className?: string;
}) {
  const nums = values.filter((v): v is number => v != null);
  if (values.length < 2 || nums.length === 0) return <div className={className} aria-hidden />;
  const min = Math.min(...nums);
  const span = Math.max(...nums) - min || 1;
  const step = 100 / (values.length - 1);
  const y = (v: number) => 24 - ((v - min) / span) * 20;

  let d = "";
  let pen = false;
  const ticks: number[] = [];
  values.forEach((v, i) => {
    if (v == null) {
      pen = false;
      ticks.push(i * step);
    } else {
      d += `${pen ? "L" : "M"}${(i * step).toFixed(2)} ${y(v).toFixed(2)} `;
      pen = true;
    }
  });
  const lone = values.length === 1 || (nums.length === 1 && !d.includes("L"));

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={className} aria-hidden>
      {ticks.map((x, i) => (
        <line key={i} x1={x} x2={x} y1={4} y2={26} stroke="#f43f5e" strokeWidth={1.4} vectorEffect="non-scaling-stroke" opacity={0.8} />
      ))}
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {lone && nums.length === 1 && <circle cx={100} cy={y(nums[0])} r={1.6} fill={color} />}
    </svg>
  );
}
