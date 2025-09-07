type Props = {
  values: number[];
  colorClass?: string; // Tailwind text color class used for stroke
};

export function Sparkline({ values, colorClass = "text-white" }: Props) {
  if (!values?.length) return null;
  const width = 96;
  const height = 48;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-full w-full ${colorClass}`}>
      <defs>
        <linearGradient id="sparklineGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        opacity="0.9"
      />
      <polygon
        fill="url(#sparklineGradient)"
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}

