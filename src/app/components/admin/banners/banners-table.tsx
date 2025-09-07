"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { type BannerMessageT } from "@/db/schema";
import { BannerFormModal } from "./banner-form-modal";

const STORAGE_KEY = "ia_banners";

function load(): BannerMessageT[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BannerMessageT[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(data: BannerMessageT[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function seedIfEmpty(setter: (d: BannerMessageT[]) => void) {
  const existing = load();
  if (existing.length) return setter(existing);
  const now = new Date().toISOString();
  const seed: BannerMessageT[] = [
    { id: crypto.randomUUID(), message: "Free shipping over $50", link_url: undefined, variant: "info", priority: 1, starts_at: undefined, ends_at: undefined, active: true, metadata: undefined, created_at: now, updated_at: now, deleted_at: null },
  ];
  save(seed);
  setter(seed);
}

export function BannersTable() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerMessageT | null>(null);
  const [items, setItems] = useState<BannerMessageT[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    seedIfEmpty(setItems);
  }, []);

  useEffect(() => {
    save(items);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) => b.message.toLowerCase().includes(q));
  }, [items, query]);

  function upsert(b: BannerMessageT) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx === -1) return [b, ...prev].sort(sorter);
      const next = [...prev];
      next[idx] = b;
      return next.sort(sorter);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  function toggleActive(id: string) {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
  }

  function sorter(a: BannerMessageT, b: BannerMessageT) {
    return b.priority - a.priority;
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <CardHeader className="gap-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <CardTitle className="text-white">Banner Messages</CardTitle>
            <CardDescription>Small announcements shown beneath the site navbar.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search message..."
                className="w-56 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <svg aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition">Create banner</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.04]">
              <TableHead>Message</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead className="hidden md:table-cell">Window</TableHead>
              <TableHead className="hidden lg:table-cell">Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-white">{b.message}</TableCell>
                <TableCell className="capitalize">{b.variant}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {(b.starts_at || b.ends_at) ? (
                    <span className="text-white/80">{b.starts_at?.slice(0,10) || "—"} → {b.ends_at?.slice(0,10) || "—"}</span>
                  ) : (
                    <span className="text-white/50">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{b.priority}</TableCell>
                <TableCell>
                  {b.active ? (
                    <Badge className="text-xs bg-emerald-400/15 text-emerald-300 border-emerald-500/20" variant="outline">Active</Badge>
                  ) : (
                    <Badge className="text-xs bg-white/10 text-white border-white/20" variant="outline">Disabled</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => { setEditing(b); setOpen(true); }} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">Edit</button>
                    <button onClick={() => toggleActive(b.id)} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">{b.active ? "Disable" : "Enable"}</button>
                    <button onClick={() => remove(b.id)} className="text-xs rounded-md px-2 py-1 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30">Delete</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-white/60 py-8">No banners found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <BannerFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(b) => upsert(b)}
        initial={editing}
      />
    </Card>
  );
}

