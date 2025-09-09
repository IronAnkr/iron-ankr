"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function AdminOrdersPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_in_cents,currency,status,payment_status,fulfillment_status,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) setError(error.message);
      setOrders((data as OrderRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Orders</h1>
          <p className="text-sm text-muted-foreground">Payments flowing in from Stripe Checkout.</p>
        </div>
      </header>

      <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Newest first. Click an order to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden md:table-cell">Placed</TableHead>
                <TableHead className="hidden md:table-cell">Order</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="hidden sm:table-cell">Fulfillment</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-sm text-white/70">Loading…</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-sm text-white/70">No orders yet.</TableCell></TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-white/5">
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="text-white hover:underline">
                        {o.id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(o.created_at).toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{o.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{o.payment_status}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-xs">{o.fulfillment_status}</Badge></TableCell>
                    <TableCell className="text-right">{formatCents(o.total_in_cents, o.currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

