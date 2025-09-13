"use client";
import Link from "next/link";
import { Home } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

type CustomerRow = {
  id: string;
  email: string;
  created_at: string;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function OwnerDashboardPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [revenueCents, setRevenueCents] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);
  const [avgOrderCents, setAvgOrderCents] = useState(0);
  const [refundsCount, setRefundsCount] = useState(0);

  useEffect(() => {
    // client-side guard
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (!uid) { setAuthorized(false); return; }
        const { data: row } = await supabase.from('app_users').select('role').eq('id', uid).maybeSingle();
        setAuthorized((row?.role || '').toLowerCase() === 'owner');
      } catch {
        setAuthorized(false);
      }
    })();
    (async () => {
      try {
        setLoading(true); setError(null);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const [{ data: od, error: oe }, { data: cd, error: ce }] = await Promise.all([
          supabase
            .from("orders")
            .select("id,total_in_cents,currency,status,payment_status,fulfillment_status,created_at")
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("customers")
            .select("id,email,created_at")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);
        if (oe) throw oe;
        if (ce) throw ce;
        const orows = (od as OrderRow[] | null) ?? [];
        setOrders(orows);
        setCustomers((cd as CustomerRow[] | null) ?? []);

        const paid = orows.filter(o => (o.payment_status || '').toLowerCase() === 'paid');
        const rev = paid.reduce((s, o) => s + (o.total_in_cents || 0), 0);
        setRevenueCents(rev);
        setOrdersCount(paid.length);
        setUnfulfilledCount(orows.filter(o => (o.fulfillment_status || '').toLowerCase() === 'unfulfilled').length);
        setRefundsCount(orows.filter(o => (o.status || '').toLowerCase() === 'refunded' || (o.payment_status||'').toLowerCase() === 'refunded').length);
        setAvgOrderCents(paid.length ? Math.round(rev / paid.length) : 0);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6">
      {authorized === false && (
        <div className="rounded-md border p-3 text-sm border-amber-600/30 bg-amber-500/10 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">Owner access required.</div>
      )}
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground">Oversee your store, teams, and systems at a glance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 border-border/60 bg-background/50 text-foreground hover:border-border">
            <Home className="h-4 w-4" /> Return to site
          </Link>
          <button className="rounded-md border px-3 py-2 border-border/60 bg-background/50 text-foreground hover:border-border">Today</button>
          <button className="rounded-md border px-3 py-2 border-border/60 bg-background/50 text-foreground hover:border-border">7 days</button>
          <button className="rounded-md border px-3 py-2 border-border/60 bg-background/50 text-foreground hover:border-border">30 days</button>
          <button className="rounded-md border px-3 py-2 border-border/60 bg-background/50 text-foreground hover:border-border">Custom…</button>
        </div>
      </header>

      {error && <div className="rounded-md border p-3 text-sm border-rose-600/30 bg-rose-500/10 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</div>}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <KPI label="Revenue (30d)" value={formatCents(revenueCents)} sub={`${ordersCount} paid orders`} />
        <KPI label="Unfulfilled" value={String(unfulfilledCount)} sub={`since ${new Date(Date.now()-30*864e5).toLocaleDateString()}`} />
        <KPI label="Avg Order" value={formatCents(avgOrderCents)} sub="cart size" />
        <KPI label="Refunds" value={String(refundsCount)} sub="this period" />
        <KPI label="Customers" value={String(customers.length)} sub="latest signups" />
        <KPI label="Orders (latest)" value={String(orders.length)} sub="fetched" />
      </section>

      {/* Quick Actions */}
      <section className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
          <div className="text-xs text-muted-foreground">Common admin tasks</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Invite team member", href: "/owner/teams" },
            { label: "Create marketing link", href: "/marketing" },
            { label: "New product", href: "/admin/products" },
            { label: "Manage discounts", href: "/admin/discounts" },
            { label: "Admin functions", href: "/admin/functions" },
          ].map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className="rounded-md border px-3 py-2 text-sm border-border/60 bg-background/50 text-foreground hover:border-border"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent orders</h3>
          <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-background/50">
              <tr>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Placed</th>
                <th className="px-3 py-2 text-left hidden sm:table-cell">Payment</th>
                <th className="px-3 py-2 text-left hidden sm:table-cell">Fulfillment</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-3 text-muted-foreground">Loading…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-3 text-muted-foreground">No recent orders.</td></tr>
              ) : (
                orders.slice(0,8).map(o => (
                  <tr key={o.id} className="hover:bg-background/50">
                    <td className="px-3 py-2 font-medium">{o.id.slice(0,8)}…</td>
                    <td className="px-3 py-2 hidden md:table-cell">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">{o.payment_status}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">{o.fulfillment_status}</td>
                    <td className="px-3 py-2 text-right">{formatCents(o.total_in_cents, o.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Activity + System */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
          </div>
          <ul className="mt-3 divide-y divide-border/60">
            {[...orders.slice(0,5).map(o => ({ t:'Order', d:`Order ${o.id.slice(0,8)}… • ${o.payment_status} • ${formatCents(o.total_in_cents,o.currency)}`, ts:o.created_at })),
              ...customers.slice(0,5).map(c => ({ t:'Customer', d:`New customer • ${c.email}`, ts:c.created_at }))]
              .sort((a,b)=> a.ts < b.ts ? 1 : -1)
              .slice(0,8)
              .map((item, i) => (
                <li key={i} className="flex items-start gap-3 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-foreground/60" />
                  <div>
                    <div className="text-sm text-foreground/90">{item.d}</div>
                    <div className="text-xs text-muted-foreground">{item.t}</div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <h3 className="text-sm font-semibold text-foreground">System status</h3>
          <div className="mt-3 space-y-2 text-sm">
            {[
              { name: "Database (Supabase)", ok: true },
              { name: "Edge Middleware", ok: true },
              { name: "Email provider", ok: true },
              { name: "Third-party APIs", ok: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-foreground/90">{s.name}</span>
                <span className={`inline-flex items-center gap-2 text-xs ${s.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                  <span className={`h-2 w-2 rounded-full ${s.ok ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {s.ok ? "Operational" : "Issues"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
