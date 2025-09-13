"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Sparkline } from "./sparkline";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
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

export function PageAnalytics() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueCents, setRevenueCents] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);
  const [revenueSpark, setRevenueSpark] = useState<number[]>([]);
  const [ordersSpark, setOrdersSpark] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data, error } = await supabase
          .from("orders")
          .select("id,total_in_cents,currency,payment_status,fulfillment_status,created_at")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: true });
        if (error) throw error;
        const rows = (data as OrderRow[] | null) ?? [];

        // Totals
        const paid = rows.filter(r => (r.payment_status || "").toLowerCase() === "paid");
        setOrdersCount(paid.length);
        const rev = paid.reduce((sum, r) => sum + (r.total_in_cents || 0), 0);
        setRevenueCents(rev);
        setUnfulfilledCount(rows.filter(r => (r.fulfillment_status || "").toLowerCase() === "unfulfilled").length);

        // Sparks for last 8 days
        const labels = lastNDaysLabels(8);
        const byDayRevenue: Record<string, number> = Object.fromEntries(labels.map(l => [l, 0]));
        const byDayOrders: Record<string, number> = Object.fromEntries(labels.map(l => [l, 0]));
        for (const r of paid) {
          const day = r.created_at.slice(0, 10);
          if (day in byDayRevenue) byDayRevenue[day] += r.total_in_cents || 0;
          if (day in byDayOrders) byDayOrders[day] += 1;
        }
        setRevenueSpark(labels.map(l => Math.round((byDayRevenue[l] || 0) / 100)));
        setOrdersSpark(labels.map(l => byDayOrders[l] || 0));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load analytics";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  const cards = [
    {
      title: "Revenue",
      value: loading ? "—" : formatCents(revenueCents, "USD"),
      delta: "",
      color: "from-emerald-400/20 to-emerald-400/0",
      data: revenueSpark,
    },
    {
      title: "Orders",
      value: loading ? "—" : String(ordersCount),
      delta: "",
      color: "from-violet-400/20 to-violet-400/0",
      data: ordersSpark,
    },
    {
      title: "Unfulfilled",
      value: loading ? "—" : String(unfulfilledCount),
      delta: "",
      color: "from-pink-400/20 to-pink-400/0",
      data: ordersSpark,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {error && (
        <div className="md:col-span-2 lg:col-span-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {cards.map((c) => (
        <Card key={c.title} className="relative overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className={`absolute inset-x-0 -top-12 h-24 bg-gradient-to-b ${c.color}`} />
          <CardHeader className="relative">
            <CardTitle className="text-sm text-white/80">{c.title}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold text-white">{c.value}</div>
                {/* Keeping delta area for future comparisons */}
              </div>
              <div className="h-12 w-24 opacity-90">
                <Sparkline values={c.data} colorClass="text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
