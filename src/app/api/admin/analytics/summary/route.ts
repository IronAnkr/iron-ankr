import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/utils/supabase/service";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

type Summary = {
  viewsCount: number;
  visitorsCount: number;
  avgDurationSec: number;
  pathsCount: number;
  labels: string[];
  viewsSpark: number[];
  visitorsSpark: number[];
  topPages: { path: string; count: number }[];
};

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

export async function GET() {
  try {
    // Ensure user is authenticated (middleware restricts admin pages, but double-check here)
    const supa = await createServerSupabase();
    const { data: auth } = await supa.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = getSupabaseServiceClient();

    const since30 = new Date(); since30.setDate(since30.getDate() - 30);
    // Pull last 30d page views and compute aggregates server-side
    type Row = { started_at: string; ended_at: string | null; device_id: string | null; fingerprint: string | null; path: string | null };
    const { data, error } = await service
      .from("page_views")
      .select("started_at,ended_at,device_id,fingerprint,path")
      .gte("started_at", since30.toISOString())
      .order("started_at", { ascending: true });
    if (error) throw error;

    const rows: Row[] = (data as Row[] | null) ?? [];
    const labels = lastNDaysLabels(30);
    const byDayViews: Record<string, number> = Object.fromEntries(labels.map(l => [l, 0]));
    const byDayVisitors: Record<string, Set<string>> = Object.fromEntries(labels.map(l => [l, new Set<string>()]));

    const visitorKeys = new Set<string>();
    let sumSec = 0; let endedCount = 0;
    const pathsSet = new Set<string>();

    for (const r of rows) {
      const key = (r.device_id && r.device_id.trim()) || (r.fingerprint && r.fingerprint.trim()) || null;
      if (key) visitorKeys.add(key);
      const day = r.started_at.slice(0, 10);
      if (day in byDayViews) {
        byDayViews[day] += 1;
        if (key) byDayVisitors[day].add(key);
      }
      if (r.path) pathsSet.add(r.path);
      if (r.ended_at) {
        const s = Date.parse(r.started_at); const e = Date.parse(r.ended_at);
        if (!Number.isNaN(s) && !Number.isNaN(e) && e > s) { sumSec += Math.round((e - s) / 1000); endedCount += 1; }
      }
    }

    // Top pages from last 7d subset
    const since7iso = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (!r.path) continue;
      if (r.started_at.slice(0, 10) < since7iso) continue;
      counts[r.path] = (counts[r.path] || 0) + 1;
    }
    const topPages = Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const summary: Summary = {
      viewsCount: rows.length,
      visitorsCount: visitorKeys.size,
      avgDurationSec: endedCount ? Math.round(sumSec / endedCount) : 0,
      pathsCount: pathsSet.size,
      labels,
      viewsSpark: labels.map(l => byDayViews[l] || 0),
      visitorsSpark: labels.map(l => byDayVisitors[l].size),
      topPages,
    };

    return NextResponse.json(summary);
  } catch (e: any) {
    const message = e?.message || "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

