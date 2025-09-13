"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  payment_status: string;
  created_at: string;
};

function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function lastNDaysLabels(n: number) {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function OverviewChart() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [labels, setLabels] = useState<string[]>([]);
  const [revenue, setRevenue] = useState<number[]>([]); // dollars per day
  const [orders, setOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data, error } = await supabase
          .from("orders")
          .select("id,total_in_cents,currency,payment_status,created_at")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: true });
        if (error) throw error;
        const rows = (data as OrderRow[] | null) ?? [];
        const paid = rows.filter(r => (r.payment_status || "").toLowerCase() === "paid");
        const ls = lastNDaysLabels(30);
        const revMap: Record<string, number> = Object.fromEntries(ls.map(l => [l, 0]));
        const ordMap: Record<string, number> = Object.fromEntries(ls.map(l => [l, 0]));
        for (const r of paid) {
          const day = r.created_at.slice(0, 10);
          if (day in revMap) revMap[day] += (r.total_in_cents || 0) / 100;
          if (day in ordMap) ordMap[day] += 1;
        }
        setLabels(ls);
        setRevenue(ls.map(l => revMap[l] || 0));
        setOrders(ls.map(l => ordMap[l] || 0));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load chart";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  const width = 720; // viewBox width (virtual)
  const height = 180;
  const step = labels.length > 1 ? width / (labels.length - 1) : width;
  const maxRev = Math.max(1, ...revenue);
  const maxOrd = Math.max(1, ...orders);

  function pointsFor(values: number[], maxVal: number) {
    const pts: string[] = [];
    for (let i = 0; i < values.length; i++) {
      const x = i * step;
      const y = height - (values[i] / maxVal) * height;
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  }

  const revPoints = pointsFor(revenue, maxRev);
  const ordPoints = pointsFor(orders, maxOrd);

  const containerRef = useRef<HTMLDivElement>(null);
  const [innerWidthPx, setInnerWidthPx] = useState<number>(width);

  // Measure container width to align hover/tooltip with scaled SVG
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const pad = 12 * 2; // p-3 left+right
      const w = Math.max(0, el.clientWidth - pad);
      setInnerWidthPx(w || width);
    }
    measure();
    let ro: ResizeObserver | null = null;
    const RO: typeof ResizeObserver | undefined = typeof window !== 'undefined' ? window.ResizeObserver : undefined;
    const el = containerRef.current;
    if (RO && el) {
      ro = new RO(() => measure());
      ro.observe(el);
    }
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (ro && el) ro.unobserve(el);
      if (ro) ro.disconnect();
    };
  }, []);

  function onMove(e: React.MouseEvent) {
    if (!containerRef.current || !labels.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pad = 12; // p-3
    const x = e.clientX - rect.left - pad;
    const clamped = Math.max(0, Math.min(innerWidthPx, x));
    const idx = labels.length > 1 ? Math.round((clamped / innerWidthPx) * (labels.length - 1)) : 0;
    setHoverIdx(Math.max(0, Math.min(labels.length - 1, idx)));
  }

  function onLeave() { setHoverIdx(null); }

  const hoverXView = hoverIdx != null && labels.length > 1 ? (hoverIdx / (labels.length - 1)) * width : null;
  const revY = hoverIdx != null ? height - (revenue[hoverIdx] / maxRev) * height : null;
  const ordY = hoverIdx != null ? height - (orders[hoverIdx] / maxOrd) * height : null;

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-b from-[hsl(var(--foreground)/0.06)] to-transparent p-4 md:p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-sm text-foreground/80">Revenue & Orders (30d)</h3>
          {!loading && (
            <div className="text-xs text-muted-foreground">{labels[0]} → {labels[labels.length-1]}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/80">
          <button onClick={() => setShowRevenue(v => !v)} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${showRevenue ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-background/50 text-muted-foreground'}`}>● Revenue</button>
          <button onClick={() => setShowOrders(v => !v)} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${showOrders ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'bg-background/50 text-muted-foreground'}`}>● Orders</button>
        </div>
      </div>
      <div ref={containerRef} className="relative overflow-hidden rounded-lg bg-background/50 p-3">
        {error && <div className="text-rose-800 dark:text-rose-200 text-sm p-2">{error}</div>}
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full">
          <defs>
            <linearGradient id="areaRev" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="areaOrd" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {showRevenue && (
            <g className="text-emerald-300">
              <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={revPoints} />
              <polygon fill="url(#areaRev)" points={`0,${height} ${revPoints} ${width},${height}`} />
            </g>
          )}
          {showOrders && (
            <g className="text-sky-300">
              <polyline fill="none" stroke="#38BDF8" strokeWidth="2.5" points={ordPoints} />
              <polygon fill="url(#areaOrd)" points={`0,${height} ${ordPoints} ${width},${height}`} />
            </g>
          )}

          {/* Hover line and circles */}
          {hoverXView != null && (
            <g>
              <line x1={hoverXView} x2={hoverXView} y1={0} y2={height} stroke="rgba(127,127,127,0.5)" strokeDasharray="4 4" />
              {showRevenue && revY != null && <circle cx={hoverXView} cy={revY} r="3" fill="#10B981" stroke="#ccc" strokeWidth="1" />}
              {showOrders && ordY != null && <circle cx={hoverXView} cy={ordY} r="3" fill="#38BDF8" stroke="#ccc" strokeWidth="1" />}
            </g>
          )}
        </svg>
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
        {/* Hover/interaction layer */}
        <div
          className="absolute inset-0"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        />
        {/* Tooltip */}
        {hoverIdx != null && (
          <div
            className="pointer-events-none absolute bg-white dark:bg-black -translate-x-1/2 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs text-foreground"
            style={{ left: 12 + (labels.length > 1 ? (innerWidthPx * (hoverIdx / (labels.length - 1))) : 0), bottom: 8 }}
          >
            <div className="text-muted-foreground">{labels[hoverIdx]}</div>
            {showRevenue && <div className="text-emerald-300">Revenue: {formatMoney(revenue[hoverIdx] || 0)}</div>}
            {showOrders && <div className="text-sky-300">Orders: {orders[hoverIdx] || 0}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
