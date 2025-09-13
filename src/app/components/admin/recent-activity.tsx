"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  payment_status: string;
  created_at: string;
};

type CustomerRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export function RecentActivity() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: ordersData, error: ordersErr }, { data: customersData, error: customersErr }] = await Promise.all([
          supabase
          .from("orders")
          .select("id,total_in_cents,currency,payment_status,created_at")
          .order("created_at", { ascending: false })
          .limit(8),
          supabase
            .from("customers")
            .select("id,email,first_name,last_name,created_at")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);
        if (ordersErr) throw ordersErr;
        if (customersErr) throw customersErr;
        setOrders((ordersData as OrderRow[] | null) ?? []);
        setCustomers((customersData as CustomerRow[] | null) ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load activity";
        setError(message);
      }
    })();
  }, [supabase]);

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription>Latest orders and amounts.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
        )}
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/10" />
          <ul className="space-y-6">
            {[...orders.map(o => ({
              kind: 'order' as const,
              id: o.id,
              created_at: o.created_at,
              node: (
                <>
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium leading-none text-white">Order {o.id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} • {o.payment_status}</p>
                  </div>
                  <div className="ml-auto text-sm font-medium text-white/90">{formatCents(o.total_in_cents, o.currency)}</div>
                </>
              ),
              badge: o.id.slice(0, 2),
            })),
            ...customers.map(c => ({
              kind: 'customer' as const,
              id: c.id,
              created_at: c.created_at,
              node: (
                <>
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium leading-none text-white">New customer</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()} • {c.email}</p>
                  </div>
                </>
              ),
              badge: (c.first_name?.[0] || c.email?.[0] || 'C').toUpperCase() + (c.last_name?.[0] || ''),
            }))]
              .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
              .slice(0, 8)
              .map((it) => (
                <li key={`${it.kind}-${it.id}`} className="relative flex items-center gap-4">
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white">
                    {it.badge || '•'}
                  </div>
                  {it.node}
                </li>
              ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
