/** Inline latency trend with a soft gradient fill. Gaps (null) are failed checks, drawn as rose ticks. */
export function Sparkline({
  values,
  color = "#6366f1",
  className = "h-10 w-full",
  id = "sp",
}: {
  values: (number | null)[];
  color?: string;
  className?: string;
  id?: string;
}) {
  const nums = values.filter((v): v is number => v != null);
  if (values.length < 2 || nums.length === 0) return <div className={className} aria-hidden />;
  const min = Math.min(...nums);
  const span = Math.max(...nums) - min || 1;
  const step = 120 / (values.length - 1);
  const y = (v: number) => 26 - ((v - min) / span) * 20;

  let line = "";
  let area = "";
  let pen = false;
  let segStart = 0;
  let lastX = 0;
  const ticks: number[] = [];
  const close = () => {
    if (pen) area += `L${lastX.toFixed(2)} 30 L${segStart.toFixed(2)} 30 Z `;
  };
  values.forEach((v, i) => {
    const x = i * step;
    if (v == null) {
      close();
      pen = false;
      ticks.push(x);
    } else {
      const seg = `${x.toFixed(2)} ${y(v).toFixed(2)}`;
      if (!pen) { segStart = x; line += `M${seg} `; area += `M${seg} `; }
      else { line += `L${seg} `; area += `L${seg} `; }
      pen = true;
      lastX = x;
    }
  });
  close();
  const gid = `${id}-${color.replace("#", "")}`;

  return (
    <svg viewBox="0 0 120 30" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      {ticks.map((x, i) => (
        <line key={i} x1={x} x2={x} y1={6} y2={29} stroke="#e11d48" strokeWidth={1.4} vectorEffect="non-scaling-stroke" opacity={0.55} />
      ))}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
