"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { type BannerMessageT } from "@/db/schema";
import { BannerFormModal } from "./banner-form-modal";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export function BannersTable() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerMessageT | null>(null);
  const [items, setItems] = useState<BannerMessageT[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from('banner_messages')
      .select('*')
      .is('deleted_at', null)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) setError(error.message);
    setItems((data as BannerMessageT[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) => b.message.toLowerCase().includes(q));
  }, [items, query]);

  async function upsert(b: BannerMessageT) {
    const id = b.id || crypto.randomUUID();
    const payload = {
      id,
      message: b.message,
      link_url: b.link_url ?? null,
      variant: b.variant,
      priority: b.priority ?? 0,
      starts_at: b.starts_at ?? null,
      ends_at: b.ends_at ?? null,
      active: b.active ?? true,
      metadata: b.metadata ?? null,
    };
    const query = editing ? supabase.from('banner_messages').update(payload).eq('id', editing.id) : supabase.from('banner_messages').insert(payload);
    const { error } = await query;
    if (error) { alert(error.message); return; }
    setOpen(false); setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from('banner_messages').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from('banner_messages').update({ active }).eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
      <CardHeader className="gap-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <CardTitle className="dark:text-white">Banner Messages</CardTitle>
            <CardDescription>Small announcements shown beneath the site navbar.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search message..."
                className="w-56 rounded-lg bg-white/5 border border-white/10 dark:text-white placeholder-white/40 px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <svg aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-md bg-white/10 dark:text-white px-3 py-2 text-sm hover:bg-white/15 transition">Create banner</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm dark:text-white/70">Loading…</TableCell>
              </TableRow>
            ) : filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium dark:text-white">{b.message}</TableCell>
                <TableCell className="capitalize">{b.variant}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {(b.starts_at || b.ends_at) ? (
                    <span className="dark:text-white/80">{b.starts_at?.slice(0,10) || "—"} → {b.ends_at?.slice(0,10) || "—"}</span>
                  ) : (
                    <span className="dark:text-white/50">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{b.priority}</TableCell>
                <TableCell>
                  {b.active ? (
                    <Badge className="text-xs bg-emerald-400/15 text-emerald-300 border-emerald-500/20" variant="outline">Active</Badge>
                  ) : (
                    <Badge className="text-xs bg-white/10 dark:text-white border-white/20" variant="outline">Disabled</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => { setEditing(b); setOpen(true); }} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">Edit</button>
                    <button onClick={() => void toggleActive(b.id, !b.active)} className="text-xs rounded-md px-2 py-1 bg-white/5 hover:bg-white/10">{b.active ? "Disable" : "Enable"}</button>
                    <button onClick={() => void remove(b.id)} className="text-xs rounded-md px-2 py-1 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30">Delete</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm dark:text-white/60 py-8">No banners found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <BannerFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(b) => { void upsert(b); }}
        initial={editing}
      />
    </Card>
  );
}
