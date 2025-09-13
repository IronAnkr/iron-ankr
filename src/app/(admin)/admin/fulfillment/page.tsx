"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  created_at: string;
};

type Address = {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

type Parcel = {
  length: number;
  width: number;
  height: number;
  distance_unit: "in" | "cm";
  weight: number;
  mass_unit: "oz" | "lb" | "g" | "kg";
};

type ShippoRate = {
  object_id: string;
  amount: string;
  currency: string;
  provider: string; // e.g., USPS
  servicelevel_name?: string; // e.g., Priority Mail 2-Day
  servicelevel?: { name?: string; token?: string };
  estimated_days?: number | null;
};

function formatCents(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function formatMoney(amount: number | string, currency = "USD") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function rateServiceName(r: ShippoRate) {
  return r.servicelevel_name || r.servicelevel?.name || r.servicelevel?.token || "";
}

export default function AdminFulfillmentPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fulfillment</h1>
          <p className="text-sm text-muted-foreground">Rate shop, buy labels, and mark orders fulfilled.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {/* Orders list */}
        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
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
                  <TableRow><TableCell colSpan={3} className="text-sm dark:text-white/70">Loading…</TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-sm dark:text-white/70">No orders need fulfillment.</TableCell></TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer hover:bg-white/[0.04]"
                      onClick={() => { setActiveOrder(o); setIsModalOpen(true); }}
                    >
                      <TableCell className="font-medium">{o.id.slice(0, 8)}…</TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(o.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCents(o.total_in_cents, o.currency)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment modal overlay */}
      {isModalOpen && activeOrder && (
        <FulfillmentModal
          order={activeOrder}
          onClose={() => { setIsModalOpen(false); setActiveOrder(null); }}
          onFulfilled={(id) => setOrders((prev) => prev.filter((o) => o.id !== id))}
        />
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <input
        className={`rounded-md bg-background/50 border border-border/60 px-2 py-1 text-foreground ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        disabled={disabled}
      />
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      className="rounded-md bg-background/50 border border-border/60 px-2 py-1 text-foreground text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AddressEditor({ value, onChange, readOnly = false }: { value: Address; onChange: (a: Address) => void; readOnly?: boolean }) {
  const v = value || { street1: "", city: "", state: "", zip: "", country: "US" };
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <LabeledInput disabled={readOnly} label="Name" value={v.name ?? ""} onChange={(s) => onChange({ ...v, name: s })} />
        <LabeledInput disabled={readOnly} label="Company" value={v.company ?? ""} onChange={(s) => onChange({ ...v, company: s })} />
      </div>
      <LabeledInput disabled={readOnly} label="Street 1" value={v.street1} onChange={(s) => onChange({ ...v, street1: s })} />
      <LabeledInput disabled={readOnly} label="Street 2" value={v.street2 ?? ""} onChange={(s) => onChange({ ...v, street2: s })} />
      <div className="grid grid-cols-3 gap-2">
        <LabeledInput disabled={readOnly} label="City" value={v.city} onChange={(s) => onChange({ ...v, city: s })} />
        <LabeledInput disabled={readOnly} label="State" value={v.state} onChange={(s) => onChange({ ...v, state: s })} />
        <LabeledInput disabled={readOnly} label="ZIP" value={v.zip} onChange={(s) => onChange({ ...v, zip: s })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <LabeledInput disabled={readOnly} label="Country" value={v.country} onChange={(s) => onChange({ ...v, country: s })} />
        <LabeledInput disabled={readOnly} label="Phone" value={v.phone ?? ""} onChange={(s) => onChange({ ...v, phone: s })} />
        <LabeledInput disabled={readOnly} label="Email" value={v.email ?? ""} onChange={(s) => onChange({ ...v, email: s })} />
      </div>
    </div>
  );
}

function FulfillmentModal({ order, onClose, onFulfilled }: { order: OrderRow; onClose: () => void; onFulfilled?: (orderId: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [toAddress, setToAddress] = useState<Address>({ street1: "", city: "", state: "", zip: "", country: "US" });
  const [parcel, setParcel] = useState<Parcel>({ length: 8, width: 6, height: 2, distance_unit: "in", weight: 16, mass_unit: "oz" });
  const [rates, setRates] = useState<ShippoRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippoRate | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [tracking, setTracking] = useState<{ number?: string; url?: string } | null>(null);
  const [orderIdToFulfill, setOrderIdToFulfill] = useState<string>(order.id);
  const [hasExistingShipment, setHasExistingShipment] = useState(false);

  useEffect(() => {
    // Load default ship-from address from server each open
    (async () => {
      try {
        const res = await fetch("/api/shippo/defaults");
        const j = await res.json();
        if (j?.from_address) setFromAddress(j.from_address);
      } catch {
        // ignore
      }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/shipping`);
        const j = await res.json();
        if (j?.to_address) setToAddress(j.to_address);
      } catch {
        // ignore
      }
    })();
    (async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/shipments`);
        const j = await res.json();
        if (Array.isArray(j?.shipments) && j.shipments.length > 0) {
          setHasExistingShipment(true);
          const last = j.last;
          setLabelUrl(last?.label_url || null);
          setTracking({ number: last?.tracking_number || undefined, url: last?.tracking_url || undefined });
        } else {
          setHasExistingShipment(false);
        }
      } catch {
        // ignore
      }
    })();
  }, [order.id]);

  async function getRates() {
    try {
      setBusy(true); setError(null); setRates([]); setSelectedRate(null); setLabelUrl(null); setTracking(null);
      const res = await fetch("/api/shippo/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_address: toAddress, from_address: fromAddress ?? undefined, parcel }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || res.statusText);
      const r: ShippoRate[] = j?.shipment?.rates || [];
      setRates(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch rates");
    } finally { setBusy(false); }
  }

  async function purchaseLabel() {
    if (!selectedRate) return;
    try {
      setBusy(true); setError(null);
      const res = await fetch("/api/shippo/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_id: selectedRate.object_id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || res.statusText);
      const t = j.transaction;
      setLabelUrl(t?.label_url || null);
      setTracking({ number: t?.tracking_number || undefined, url: t?.tracking_url_provider || undefined });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to purchase label");
    } finally { setBusy(false); }
  }

  async function markFulfilled() {
    if (!orderIdToFulfill) return;
    try {
      setBusy(true); setError(null);
      const body = {
        order_id: orderIdToFulfill,
        tracking_number: tracking?.number,
        tracking_url: tracking?.url,
        label_url: labelUrl,
        carrier: selectedRate?.provider,
        service: selectedRate ? rateServiceName(selectedRate) : undefined,
      };
      const res = await fetch("/api/fulfillment/mark-fulfilled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || res.statusText);
      setHasExistingShipment(true);
      if (onFulfilled) onFulfilled(order.id);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to mark fulfilled");
    } finally { setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[99998]">
      {/* Backdrop */}
      <div className="fixed inset-0 z-[99999] bg-foreground/20" onClick={onClose} />
      {/* Content */}
      <div className="fixed inset-0 z-[100000] flex flex-col pt-20 md:pt-24">
        <div className="shrink-0 flex items-center justify-between px-4 md:px-8 h-14 border-b border-border/60 bg-card">
          <div className="flex flex-col">
            <div className="text-sm text-muted-foreground">Fulfill Order</div>
            <div className="text-foreground font-semibold">{order.id.slice(0,8)}… • {new Date(order.created_at).toLocaleString()} • {formatCents(order.total_in_cents, order.currency)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/orders/${order.id}`} className="rounded-md border border-border/60 bg-background/50 px-2 py-1 text-xs text-foreground/90 hover:border-border">View details</Link>
            <button aria-label="Close" onClick={onClose} className="rounded-md border border-border/60 bg-background/50 px-2 py-1 text-sm text-foreground/90 hover:border-border">✕</button>
          </div>
        </div>
        <div className="grow overflow-auto px-4 md:px-8 py-4 bg-background">
          <div className="mx-auto max-w-4xl">
            {error && <div className="mb-3 rounded-md border border-border/60 bg-card/60 p-3 text-sm text-rose-800 dark:text-rose-200">{error}</div>}

            {/* From address */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Ship From</h3>
                <button
                  className="text-xs rounded-md border border-border/60 bg-background/50 px-2 py-1 text-foreground/80 hover:border-border"
                  onClick={async () => {
                    const res = await fetch("/api/shippo/defaults");
                    const j = await res.json();
                    setFromAddress(j?.from_address || null);
                  }}
                >Load defaults</button>
              </div>
              <AddressEditor value={fromAddress ?? { street1: "", city: "", state: "", zip: "", country: "US" }} onChange={setFromAddress} />
            </div>

            {/* To address */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Ship To</h3>
                <span className="text-xs text-muted-foreground">From customer</span>
              </div>
              <AddressEditor value={toAddress} onChange={setToAddress} readOnly />
            </div>

            {/* Parcel */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold">Parcel</h3>
              <div className="grid grid-cols-3 gap-3">
                <LabeledInput label="Len" type="number" value={parcel.length} onChange={(v) => setParcel({ ...parcel, length: Number(v) })} />
                <LabeledInput label="Wid" type="number" value={parcel.width} onChange={(v) => setParcel({ ...parcel, width: Number(v) })} />
                <LabeledInput label="Hgt" type="number" value={parcel.height} onChange={(v) => setParcel({ ...parcel, height: Number(v) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput label="Weight" type="number" value={parcel.weight} onChange={(v) => setParcel({ ...parcel, weight: Number(v) })} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={parcel.distance_unit} onChange={(v) => setParcel({ ...parcel, distance_unit: v as Parcel["distance_unit"] })} options={["in", "cm"]} />
                  <Select value={parcel.mass_unit} onChange={(v) => setParcel({ ...parcel, mass_unit: v as Parcel["mass_unit"] })} options={["oz", "lb", "g", "kg"]} />
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={getRates}
                  disabled={busy || hasExistingShipment}
                  className="rounded-md bg-foreground text-background px-3 py-2 text-sm hover:bg-foreground/90 disabled:opacity-60"
                >{busy ? "Fetching rates…" : "Get Rates"}</button>
                <button
                  onClick={() => { setRates([]); setSelectedRate(null); setLabelUrl(null); setTracking(null); }}
                  className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground/80 hover:border-border"
                >Reset</button>
              </div>
              {rates.length > 0 && (
                <div className="max-h-64 overflow-auto rounded-md border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-3 py-2">Service</th>
                        <th className="text-left px-3 py-2">Carrier</th>
                        <th className="text-right px-3 py-2">ETA</th>
                        <th className="text-right px-3 py-2">Rate</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((r) => (
                        <tr key={r.object_id} className={selectedRate?.object_id === r.object_id ? "bg-muted/60" : ""}>
                          <td className="px-3 py-1.5">{rateServiceName(r)}</td>
                          <td className="px-3 py-1.5">{r.provider}</td>
                          <td className="px-3 py-1.5 text-right">{r.estimated_days ? `${r.estimated_days}d` : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{formatMoney(r.amount, r.currency || "USD")}</td>
                          <td className="px-3 py-1.5 text-right">
                            <button
                              onClick={() => setSelectedRate(r)}
                              className="rounded-md border border-border/60 bg-background/50 px-2 py-1 text-xs text-foreground/90 hover:border-border"
                            >Select</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Purchase */}
            <div className="space-y-3 pb-8">
              <button
                onClick={purchaseLabel}
                disabled={!selectedRate || busy || hasExistingShipment}
                className="w-full rounded-md bg-foreground text-background px-3 py-2 text-sm hover:bg-foreground/90 disabled:opacity-60"
              >{busy ? "Purchasing…" : selectedRate ? `Buy Label: ${selectedRate.provider} ${rateServiceName(selectedRate)}` : "Select a rate to buy label"}</button>

              {(labelUrl || tracking) && (
                <div className="rounded-md border border-border/60 bg-card/60 p-3 text-sm text-foreground/80 space-y-2">
                  {labelUrl && (
                    <div className="flex items-center justify-between">
                      <span>Label</span>
                      <a href={labelUrl} target="_blank" className="rounded-md border border-border/60 bg-background/50 px-2 py-1 text-xs hover:border-border">Download</a>
                    </div>
                  )}
                  {tracking?.number && (
                    <div className="flex items-center justify-between">
                      <span>Tracking</span>
                      <a href={tracking.url} target="_blank" className="rounded-md border border-border/60 bg-background/50 px-2 py-1 text-xs hover:border-border">{tracking.number}</a>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-end">
                <LabeledInput label="Order ID" value={orderIdToFulfill} onChange={setOrderIdToFulfill} disabled />
                <button
                  onClick={markFulfilled}
                  disabled={!orderIdToFulfill || busy || hasExistingShipment}
                  className="col-span-2 rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground/80 hover:border-border disabled:opacity-60 text-left"
                >{hasExistingShipment ? 'Already fulfilled' : 'Mark Fulfilled (save tracking)'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
