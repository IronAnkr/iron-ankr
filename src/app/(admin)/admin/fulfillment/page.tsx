"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import Link from "next/link";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  created_at: string;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function AdminFulfillmentPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      // Placeholder: list unfulfilled orders to act on
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_in_cents,currency,created_at")
        .eq("fulfillment_status", "unfulfilled")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) setError(error.message);
      setOrders((data as OrderRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fulfillment</h1>
          <p className="text-sm text-muted-foreground">Pick, pack, and ship orders. (Scaffold)</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Unfulfilled Orders</CardTitle>
            <CardDescription>Newest orders waiting for fulfillment.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">Placed</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-sm text-white/70">Loading…</TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-sm text-white/70">No orders need fulfillment.</TableCell></TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell><Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.id.slice(0, 8)}…</Link></TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(o.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCents(o.total_in_cents, o.currency)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Coming soon.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            This is a scaffold. We’ll add pick lists, bulk fulfill, label purchasing, and tracking uploads here in the next branch.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

