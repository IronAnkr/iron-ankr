export function OverviewChart() {
  const width = 720;
  const height = 180;
  const data = [20, 24, 18, 26, 28, 36, 30, 42, 38, 48, 52, 60];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-4 md:p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-sm text-white/80">Revenue Trend</h3>
          <div className="text-2xl font-semibold text-white">$248k <span className="text-sm text-white/60 font-normal align-middle">YTD</span></div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/15 px-2 py-0.5 text-emerald-300">● Revenue</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-400/15 px-2 py-0.5 text-sky-300">● Orders</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-white/5 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full text-emerald-300">
          <defs>
            <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline fill="none" stroke="currentColor" strokeWidth="2.5" points={points} />
          <polygon fill="url(#area)" points={`0,${height} ${points} ${width},${height}`} />
        </svg>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      </div>
    </div>
  );
}

