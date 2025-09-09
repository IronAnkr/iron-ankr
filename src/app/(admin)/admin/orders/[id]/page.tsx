"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

type Order = {
  id: string;
  subtotal_in_cents: number;
  discount_in_cents: number;
  tax_in_cents: number;
  shipping_in_cents: number;
  total_in_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  placed_at: string | null;
  metadata: Record<string, unknown> | null;
};

type Item = {
  id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  sku: string | null;
  quantity: number;
  unit_price_in_cents: number;
  total_price_in_cents: number;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = String(params?.id ?? "");
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true); setError(null);
      const [oRes, iRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id,subtotal_in_cents,discount_in_cents,tax_in_cents,shipping_in_cents,total_in_cents,currency,status,payment_status,fulfillment_status,created_at,placed_at,metadata")
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("order_line_items")
          .select("id,product_id,variant_id,title,sku,quantity,unit_price_in_cents,total_price_in_cents")
          .eq("order_id", orderId)
      ]);
      if (oRes.error) setError(oRes.error.message);
      setOrder((oRes.data as Order | null) ?? null);
      if (iRes.error) setError(iRes.error.message);
      setItems((iRes.data as Item[] | null) ?? []);
      setLoading(false);
    })();
  }, [orderId, supabase]);

  const currency = order?.currency || "USD";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Order {orderId.slice(0, 8)}…</h1>
          <p className="text-sm text-muted-foreground">Created {order ? new Date(order.created_at).toLocaleString() : "—"}</p>
        </div>
        <Link href="/admin/orders" className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 hover:border-white/30">Back to Orders</Link>
      </header>

      {error && <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Line items purchased in this order.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-white/70">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-white/70">No items found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{it.sku ?? "—"}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{formatCents(it.unit_price_in_cents, currency)}</TableCell>
                      <TableCell className="text-right">{formatCents(it.total_price_in_cents, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Order and fulfillment state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Order</span><Badge variant="outline" className="text-xs">{order?.status ?? "—"}</Badge></div>
              <div className="flex items-center justify-between"><span>Payment</span><Badge variant="outline" className="text-xs">{order?.payment_status ?? "—"}</Badge></div>
              <div className="flex items-center justify-between"><span>Fulfillment</span><Badge variant="outline" className="text-xs">{order?.fulfillment_status ?? "—"}</Badge></div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
            <CardHeader>
              <CardTitle>Totals</CardTitle>
              <CardDescription>Breakdown of charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCents(order?.subtotal_in_cents ?? 0, currency)}</span></div>
              <div className="flex items-center justify-between"><span>Discounts</span><span>-{formatCents(order?.discount_in_cents ?? 0, currency)}</span></div>
              <div className="flex items-center justify-between"><span>Tax</span><span>{formatCents(order?.tax_in_cents ?? 0, currency)}</span></div>
              <div className="flex items-center justify-between"><span>Shipping</span><span>{formatCents(order?.shipping_in_cents ?? 0, currency)}</span></div>
              <div className="border-t border-white/10 pt-2 flex items-center justify-between font-semibold"><span>Total</span><span>{formatCents(order?.total_in_cents ?? 0, currency)}</span></div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Identifiers and metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-white/80">
              <div className="flex items-center justify-between gap-4"><span>Checkout Session</span><span className="truncate max-w-[220px]">{String(order?.metadata?.["stripe_checkout_session_id"] ?? "—")}</span></div>
              <div className="flex items-center justify-between gap-4"><span>Payment Intent</span><span className="truncate max-w-[220px]">{String(order?.metadata?.["stripe_payment_intent_id"] ?? "—")}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

