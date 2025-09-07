"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { type DiscountT } from "@/db/schema";
import { DiscountFormModal } from "./discount-form-modal";

const STORAGE_KEY = "ia_discounts";

function loadDiscounts(): DiscountT[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiscountT[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDiscounts(data: DiscountT[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function seedIfEmpty(setter: (d: DiscountT[]) => void) {
  const existing = loadDiscounts();
  if (existing.length) return setter(existing);
  const now = new Date().toISOString();
  const nowDate = new Date();
  const seed: DiscountT[] = [
    { id: crypto.randomUUID(), code: "WELCOME10", type: "percent", value: 10, active: true, uses_count: 143, created_at: now, updated_at: now, deleted_at: null },
    { id: crypto.randomUUID(), code: "FREESHIP", type: "amount", value: 5, active: true, uses_count: 82, created_at: now, updated_at: now, deleted_at: null },
    { id: crypto.randomUUID(), code: "SPRING20", type: "percent", value: 20, active: false, start_date: nowDate, end_date: nowDate, uses_count: 210, created_at: now, updated_at: now, deleted_at: null },
  ];
  saveDiscounts(seed);
  setter(seed);
}

export function DiscountsTable() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountT | null>(null);
  const [items, setItems] = useState<DiscountT[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    seedIfEmpty(setItems);
  }, []);

  useEffect(() => {
    saveDiscounts(items);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.code.toLowerCase().includes(q));
  }, [items, query]);

  function upsert(d: DiscountT) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === d.id);
      if (idx === -1) return [d, ...prev];
      const next = [...prev];
      next[idx] = d;
      return next;
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this discount?")) return;
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  function toggleActive(id: string) {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
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
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-white">{d.code}</TableCell>
                <TableCell className="capitalize">{d.type}</TableCell>
                <TableCell>
                  {d.type === "percent" ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {(d.start_date || d.end_date) ? (
                    <span className="text-white/80">{d.start_date ? d.start_date.toISOString().slice(0,10) : "—"} → {d.end_date ? d.end_date.toISOString().slice(0,10) : "—"}</span>
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
                    <button onClick={() => toggleActive(d.id)} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">{d.active ? "Disable" : "Enable"}</button>
                    <button onClick={() => remove(d.id)} className="text-xs rounded-md px-2 py-1 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30">Delete</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
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
        onSave={(d) => upsert(d)}
        initial={editing}
      />
    </Card>
  );
}
