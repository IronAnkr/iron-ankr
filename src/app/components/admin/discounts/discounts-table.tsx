"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { type DiscountT } from "@/db/schema";
import { DiscountFormModal } from "./discount-form-modal";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export function DiscountsTable() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountT | null>(null);
  const [items, setItems] = useState<DiscountT[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setItems((data as DiscountT[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.code.toLowerCase().includes(q));
  }, [items, query]);

  async function upsert(d: DiscountT) {
    // Map dates to string (date) columns
    const payload = {
      id: d.id || crypto.randomUUID(),
      code: d.code.trim().toUpperCase(),
      type: d.type,
      value: d.value,
      description: d.description ?? null,
      start_date: d.start_date ? new Date(d.start_date).toISOString().slice(0,10) : null,
      end_date: d.end_date ? new Date(d.end_date).toISOString().slice(0,10) : null,
      max_uses: d.max_uses ?? null,
      uses_count: d.uses_count ?? 0,
      product_ids: d.product_ids ?? null,
      variant_ids: d.variant_ids ?? null,
      minimum_subtotal_in_cents: d.minimum_subtotal_in_cents ?? null,
      active: d.active ?? true,
      metadata: d.metadata ?? null,
    };
    const query = editing ? supabase.from('discounts').update(payload).eq('id', editing.id) : supabase.from('discounts').insert(payload);
    const { error } = await query;
    if (error) { alert(error.message); return; }
    setOpen(false); setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this discount?")) return;
    const { error } = await supabase.from('discounts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from('discounts').update({ active }).eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <CardHeader className="gap-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <CardTitle className="text-white">Discounts</CardTitle>
            <CardDescription>Manage discount and promo codes.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code..."
                className="w-56 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <svg aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition">Create discount</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.04]">
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="hidden md:table-cell">Window</TableHead>
              <TableHead className="hidden lg:table-cell">Max/Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-white/70">Loading…</TableCell>
              </TableRow>
            ) : filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-white">{d.code}</TableCell>
                <TableCell className="capitalize">{d.type}</TableCell>
                <TableCell>
                  {d.type === "percent" ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {(d.start_date || d.end_date) ? (
                    <span className="text-white/80">{d.start_date ? (typeof d.start_date === 'string' ? d.start_date : d.start_date.toISOString().slice(0,10)) : "—"} → {d.end_date ? (typeof d.end_date === 'string' ? d.end_date : d.end_date.toISOString().slice(0,10)) : "—"}</span>
                  ) : (
                    <span className="text-white/50">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-white/80">{d.max_uses ?? "∞"}</span>
                  <span className="text-white/40"> / </span>
                  <span className="text-white/80">{d.uses_count}</span>
                </TableCell>
                <TableCell>
                  {d.active ? (
                    <Badge className="text-xs bg-emerald-400/15 text-emerald-300 border-emerald-500/20" variant="outline">Active</Badge>
                  ) : (
                    <Badge className="text-xs bg-white/10 text-white border-white/20" variant="outline">Disabled</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => { setEditing(d); setOpen(true); }} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">Edit</button>
                    <button onClick={() => void toggleActive(d.id, !d.active)} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">{d.active ? "Disable" : "Enable"}</button>
                    <button onClick={() => void remove(d.id)} className="text-xs rounded-md px-2 py-1 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30">Delete</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-white/60 py-8">No discounts match your search.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <DiscountFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(d) => { void upsert(d); }}
        initial={editing}
      />
    </Card>
  );
}
