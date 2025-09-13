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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

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
                  <TableRow
                    key={o.id}
                    className="hover:bg-white/5 cursor-pointer"
                    onClick={() => { setActiveOrderId(o.id); setIsModalOpen(true); }}
                  >
                    <TableCell className="font-medium">{o.id.slice(0, 8)}…</TableCell>
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

      {isModalOpen && activeOrderId && (
        <OrderDetailModal
          orderId={activeOrderId}
          onClose={() => { setIsModalOpen(false); setActiveOrderId(null); }}
        />
      )}
    </div>
  );
}

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

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orderId, supabase, onClose]);

  const currency = order?.currency || "USD";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100000]">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="fixed inset-0 z-[100001] flex flex-col pt-20 md:pt-24">
        <div className="shrink-0 flex items-center justify-between px-4 md:px-8 h-14 border-b border-white/10 bg-black">
          <div>
            <div className="text-sm text-white/70">Order</div>
            <div className="text-white font-semibold">{orderId.slice(0,8)}… {order ? `• ${new Date(order.created_at).toLocaleString()} • ${formatCents(order.total_in_cents, currency)}` : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/orders/${orderId}`} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/90 hover:border-white/30">Open full page</Link>
            <button aria-label="Close" onClick={onClose} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-sm text-white/90 hover:border-white/30">✕</button>
          </div>
        </div>
        <div className="grow overflow-auto px-4 md:px-8 py-4 bg-black">
          <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>Line items in this order.</CardDescription>
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
      </div>
    </div>
  );
}
