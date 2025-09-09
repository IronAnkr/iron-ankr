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
  servicelevel_name: string; // e.g., Priority Mail 2-Day
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

export default function AdminFulfillmentPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workbench state
  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [toAddress, setToAddress] = useState<Address>({ street1: "", city: "", state: "", zip: "", country: "US" });
  const [parcel, setParcel] = useState<Parcel>({ length: 8, width: 6, height: 2, distance_unit: "in", weight: 16, mass_unit: "oz" });
  const [rates, setRates] = useState<ShippoRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippoRate | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [tracking, setTracking] = useState<{ number?: string; url?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [orderIdToFulfill, setOrderIdToFulfill] = useState<string>("");

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

  useEffect(() => {
    // Load default ship-from address from server
    (async () => {
      try {
        const res = await fetch("/api/shippo/defaults");
        const j = await res.json();
        if (j?.from_address) setFromAddress(j.from_address);
      } catch {
        // ignore
      }
    })();
  }, []);

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
        service: selectedRate?.servicelevel_name,
      };
      const res = await fetch("/api/fulfillment/mark-fulfilled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || res.statusText);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to mark fulfilled");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fulfillment</h1>
          <p className="text-sm text-muted-foreground">Rate shop, buy labels, and mark orders fulfilled.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders list */}
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

        {/* Workbench */}
        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Label & Shipment</CardTitle>
            <CardDescription>Fast flow: address → parcel → rate → label.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* From address */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ship From</h3>
                <button
                  className="text-xs rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/80 hover:border-white/30"
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
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ship To</h3>
                <span className="text-xs text-white/50">Paste from order or customer</span>
              </div>
              <AddressEditor value={toAddress} onChange={setToAddress} />
            </div>

            {/* Parcel */}
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold">Parcel</h3>
              <div className="grid grid-cols-3 gap-2">
                <LabeledInput label="Len" type="number" value={parcel.length} onChange={(v) => setParcel({ ...parcel, length: Number(v) })} />
                <LabeledInput label="Wid" type="number" value={parcel.width} onChange={(v) => setParcel({ ...parcel, width: Number(v) })} />
                <LabeledInput label="Hgt" type="number" value={parcel.height} onChange={(v) => setParcel({ ...parcel, height: Number(v) })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <LabeledInput label="Weight" type="number" value={parcel.weight} onChange={(v) => setParcel({ ...parcel, weight: Number(v) })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={parcel.distance_unit} onChange={(v) => setParcel({ ...parcel, distance_unit: v as Parcel["distance_unit"] })} options={["in", "cm"]} />
                  <Select value={parcel.mass_unit} onChange={(v) => setParcel({ ...parcel, mass_unit: v as Parcel["mass_unit"] })} options={["oz", "lb", "g", "kg"]} />
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={getRates}
                  disabled={busy}
                  className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/90 hover:border-white/30 disabled:opacity-60"
                >{busy ? "Fetching rates…" : "Get Rates"}</button>
                <button
                  onClick={() => { setRates([]); setSelectedRate(null); setLabelUrl(null); setTracking(null); }}
                  className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:border-white/30"
                >Reset</button>
              </div>
              {rates.length > 0 && (
                <div className="max-h-56 overflow-auto rounded-md border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.04]">
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
                        <tr key={r.object_id} className={selectedRate?.object_id === r.object_id ? "bg-white/[0.06]" : ""}>
                          <td className="px-3 py-1.5">{r.servicelevel_name}</td>
                          <td className="px-3 py-1.5">{r.provider}</td>
                          <td className="px-3 py-1.5 text-right">{r.estimated_days ? `${r.estimated_days}d` : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{formatMoney(r.amount, r.currency || "USD")}</td>
                          <td className="px-3 py-1.5 text-right">
                            <button
                              onClick={() => setSelectedRate(r)}
                              className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/90 hover:border-white/30"
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
            <div className="space-y-3">
              <button
                onClick={purchaseLabel}
                disabled={!selectedRate || busy}
                className="w-full rounded-md border border-white/15 bg-white/15 px-3 py-2 text-sm text-white hover:border-white/30 disabled:opacity-60"
              >{busy ? "Purchasing…" : selectedRate ? `Buy Label: ${selectedRate.provider} ${selectedRate.servicelevel_name}` : "Select a rate to buy label"}</button>

              {(labelUrl || tracking) && (
                <div className="rounded-md border border-white/10 p-3 text-sm text-white/80 space-y-2">
                  {labelUrl && (
                    <div className="flex items-center justify-between">
                      <span>Label</span>
                      <a href={labelUrl} target="_blank" className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs hover:border-white/30">Download</a>
                    </div>
                  )}
                  {tracking?.number && (
                    <div className="flex items-center justify-between">
                      <span>Tracking</span>
                      <a href={tracking.url} target="_blank" className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs hover:border-white/30">{tracking.number}</a>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-end">
                <LabeledInput label="Order ID" value={orderIdToFulfill} onChange={setOrderIdToFulfill} />
                <button
                  onClick={markFulfilled}
                  disabled={!orderIdToFulfill || busy}
                  className="col-span-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:border-white/30 disabled:opacity-60 text-left"
                >Mark Fulfilled (saves tracking to order)</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="grid gap-1 text-xs text-white/70">
      <span>{label}</span>
      <input
        className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-white"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-white text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AddressEditor({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  const v = value || { street1: "", city: "", state: "", zip: "", country: "US" };
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <LabeledInput label="Name" value={v.name ?? ""} onChange={(s) => onChange({ ...v, name: s })} />
        <LabeledInput label="Company" value={v.company ?? ""} onChange={(s) => onChange({ ...v, company: s })} />
      </div>
      <LabeledInput label="Street 1" value={v.street1} onChange={(s) => onChange({ ...v, street1: s })} />
      <LabeledInput label="Street 2" value={v.street2 ?? ""} onChange={(s) => onChange({ ...v, street2: s })} />
      <div className="grid grid-cols-3 gap-2">
        <LabeledInput label="City" value={v.city} onChange={(s) => onChange({ ...v, city: s })} />
        <LabeledInput label="State" value={v.state} onChange={(s) => onChange({ ...v, state: s })} />
        <LabeledInput label="ZIP" value={v.zip} onChange={(s) => onChange({ ...v, zip: s })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <LabeledInput label="Country" value={v.country} onChange={(s) => onChange({ ...v, country: s })} />
        <LabeledInput label="Phone" value={v.phone ?? ""} onChange={(s) => onChange({ ...v, phone: s })} />
        <LabeledInput label="Email" value={v.email ?? ""} onChange={(s) => onChange({ ...v, email: s })} />
      </div>
    </div>
  );
}
