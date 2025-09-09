"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
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

export function OrdersNeedingFulfillment() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_in_cents,currency,payment_status,fulfillment_status,created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) setError(error.message);
      setOrders((data as OrderRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <CardHeader>
        <CardTitle className="text-white">Orders</CardTitle>
        <CardDescription>Recent orders from Stripe checkout.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.04]">
              <TableHead>Order</TableHead>
              <TableHead className="hidden sm:table-cell">Payment</TableHead>
              <TableHead className="hidden sm:table-cell">Fulfillment</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-sm text-white/70">Loading…</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-sm text-white/70">No orders yet.</TableCell></TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id.slice(0, 8)}…</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant="outline">{o.payment_status}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant="outline">{o.fulfillment_status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(o.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatCents(o.total_in_cents, o.currency)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
