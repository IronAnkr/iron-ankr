"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkline } from "@/app/components/admin/sparkline";


function formatDuration(sec: number) {
  if (!sec || sec < 1) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AdminAnalyticsDetailPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [viewsCount, setViewsCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [avgDurationSec, setAvgDurationSec] = useState(0);
  const [pathsCount, setPathsCount] = useState(0);

  // Charts (30d)
  const [labels, setLabels] = useState<string[]>([]);
  const [viewsSpark, setViewsSpark] = useState<number[]>([]);
  const [visitorsSpark, setVisitorsSpark] = useState<number[]>([]);

  // Top pages (7d)
  const [topPages, setTopPages] = useState<{ path: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch("/api/admin/analytics/summary", { method: "GET" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        setViewsCount(json.viewsCount || 0);
        setVisitorsCount(json.visitorsCount || 0);
        setAvgDurationSec(json.avgDurationSec || 0);
        setPathsCount(json.pathsCount || 0);
        setLabels(json.labels || []);
        setViewsSpark(json.viewsSpark || []);
        setVisitorsSpark(json.visitorsSpark || []);
        setTopPages((json.topPages || []) as { path: string; count: number }[]);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load analytics";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Page views and engagement details.</p>
        </div>
        <Link href="/admin" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Back to Dashboard</Link>
      </header>

      {error && (
        <div className="rounded-md border p-3 text-sm border-rose-600/30 bg-rose-500/10 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </div>
      )}

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Views (30d)", value: loading ? "—" : String(viewsCount), data: viewsSpark, color: "text-foreground" },
          { title: "Visitors (30d)", value: loading ? "—" : String(visitorsCount), data: visitorsSpark, color: "text-foreground" },
          { title: "Avg Time", value: loading ? "—" : formatDuration(avgDurationSec), data: viewsSpark, color: "text-foreground" },
          { title: "Pages (30d)", value: loading ? "—" : String(pathsCount), data: viewsSpark, color: "text-foreground" },
        ].map((k) => (
          <div key={k.title} className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-[hsl(var(--foreground)/0.06)] to-transparent">
            <div className="p-4">
              <div className="text-sm text-foreground/80">{k.title}</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-3xl font-semibold text-foreground">{k.value}</div>
                <div className="h-12 w-24 opacity-90">
                  <Sparkline values={k.data} colorClass={k.color} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Trend chart: Views & Visitors (30d) */}
      <section className="rounded-xl border border-border/60 bg-gradient-to-b from-[hsl(var(--foreground)/0.06)] to-transparent p-4 md:p-6">
        <div className="mb-3 text-sm text-foreground/80">Views & Visitors (30d)</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Views per day</div>
            <div className="h-24">
              <Sparkline values={viewsSpark} colorClass="text-sky-400" />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Visitors per day</div>
            <div className="h-24">
              <Sparkline values={visitorsSpark} colorClass="text-emerald-400" />
            </div>
          </div>
        </div>
        {!loading && labels.length > 0 && (
          <div className="mt-2 text-[11px] text-muted-foreground">{labels[0]} → {labels[labels.length-1]}</div>
        )}
      </section>

      {/* Top pages (7d) */}
      <section className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">Top pages (7d)</div>
          <div className="text-xs text-muted-foreground">Most viewed by path</div>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : topPages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No page views yet.</div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-background/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Path</th>
                  <th className="px-3 py-2 text-right font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.path} className="border-t border-border/60">
                    <td className="px-3 py-2 text-foreground/90">{p.path}</td>
                    <td className="px-3 py-2 text-right text-foreground/90">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AI Insights placeholder */}
      <section className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6">
        <div className="text-sm font-semibold text-foreground">AI Insights</div>
        <p className="mt-2 text-sm text-muted-foreground max-w-prose">
          Coming soon: automatic insights summarizing trends, top content, anomalies, and recommendations based on your recent traffic and conversions.
        </p>
        <div className="mt-3 text-xs text-muted-foreground">We’ll comb through page views, referrers, paths, and session durations.</div>
      </section>
    </div>
  );
}
