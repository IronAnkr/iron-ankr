"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type Banner = {
  id: string;
  message: string;
  link_url: string | null;
  variant: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
};

export default function MarketingBannersPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [variant, setVariant] = useState<"info"|"success"|"warning"|"error">("info");
  const [priority, setPriority] = useState("0");
  const [saving, setSaving] = useState(false);
  const { isMarketingAdmin } = useMarketingAccess();
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<string>("");
  const [rowSaving, setRowSaving] = useState<boolean>(false);
  const suppressBlurRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banner_messages")
      .select("id,message,link_url,variant,priority,starts_at,ends_at,active,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setItems((data as Banner[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function createBanner(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const pri = parseInt(priority, 10) || 0;
    const { data, error } = await supabase
      .from("banner_messages")
      .insert({ id: crypto.randomUUID(), message: message.trim(), link_url: link || null, variant, priority: pri, active: true })
      .select()
      .single();
    if (error) setError(error.message);
    if (data) setItems((prev) => [data as Banner, ...prev]);
    setMessage(""); setLink(""); setVariant("info"); setPriority("0");
    setSaving(false);
  }

  async function toggleActive(id: string, active: boolean) {
    if (!isMarketingAdmin) return;
    const { data, error } = await supabase
      .from("banner_messages")
      .update({ active: !active })
      .eq("id", id)
      .select()
      .single();
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.map((b) => (b.id === id ? (data as Banner) : b)));
  }

  async function remove(id: string) {
    if (!isMarketingAdmin) return;
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("banner_messages").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function beginEdit(b: Banner) {
    if (!isMarketingAdmin) return;
    setEditingId(b.id);
    setEditingPriority(String(b.priority ?? 0));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingPriority("");
    setRowSaving(false);
  }

  async function commitEdit() {
    if (!isMarketingAdmin || !editingId) return;
    const newVal = parseInt(editingPriority, 10);
    if (Number.isNaN(newVal)) { cancelEdit(); return; }
    setRowSaving(true);
    const { data, error } = await supabase
      .from("banner_messages")
      .update({ priority: newVal })
      .eq("id", editingId)
      .select()
      .single();
    if (error) {
      setError(error.message);
    } else if (data) {
      setItems((prev) => prev.map((b) => (b.id === editingId ? (data as Banner) : b)));
    }
    cancelEdit();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-white">Banners</h1>
        <p className="text-sm text-white/70">Manage site-wide promo banners.</p>
      </header>

      <form onSubmit={createBanner} className="rounded-lg border border-white/10 bg-black/60 p-4 grid gap-3">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Banner message" className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" required />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://link (optional)" className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" />
        <div className="flex gap-3">
          <select value={variant} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVariant(e.target.value as "info"|"success"|"warning"|"error")} className="rounded-md border-white/20 bg-black/80 px-3 py-2 text-white">
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Priority (0)" className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" />
        </div>
        {/* Live preview */}
        {message.trim() && (
          <div className="rounded-md overflow-hidden border border-white/10">
            <BannerPreview variant={variant} message={message} link={link} />
          </div>
        )}
        <div>
          <button disabled={!message.trim() || saving} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving…' : 'Create banner'}</button>
        </div>
      </form>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {loading ? (
        <div className="text-white/80">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm text-white/90">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="p-3 text-left">Message</th>
                <th className="p-3">Variant</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 text-left">{b.message}</td>
                  <td className="p-3 text-center uppercase text-white/80">{b.variant}</td>
                  <td className="p-3 text-center">
                    {isMarketingAdmin ? (
                      editingId === b.id ? (
                        <div className="inline-flex items-center gap-2">
                          <input
                            autoFocus
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value.replace(/[^0-9-]/g, ''))}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            onBlur={() => { setTimeout(() => { if (!suppressBlurRef.current) commitEdit(); suppressBlurRef.current = false; }, 0); }}
                            className="w-20 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-white text-sm"
                            inputMode="numeric"
                          />
                          <button
                            onMouseDown={() => { suppressBlurRef.current = true; }}
                            onClick={commitEdit}
                            disabled={rowSaving}
                            className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                          >Save</button>
                          <button
                            onMouseDown={() => { suppressBlurRef.current = true; }}
                            onClick={cancelEdit}
                            className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => beginEdit(b)} className="hover:underline text-white/90">
                          {b.priority}
                        </button>
                      )
                    ) : (
                      b.priority
                    )}
                  </td>
                  <td className="p-3 text-center">{b.active ? 'Yes' : 'No'}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-3">
                    {isMarketingAdmin && (
                      <>
                        <button onClick={() => toggleActive(b.id, b.active)} className="text-blue-300 hover:underline">{b.active ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => remove(b.id)} className="text-rose-300 hover:underline">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function bannerStyles(variant: "info"|"success"|"warning"|"error") {
  switch (variant) {
    case "success":
      return { bg: "bg-emerald-500/25", text: "text-emerald-100", border: "border-t border-emerald-500/30" };
    case "warning":
      return { bg: "bg-amber-500/25", text: "text-amber-100", border: "border-t border-amber-500/30" };
    case "error":
      return { bg: "bg-rose-500/25", text: "text-rose-100", border: "border-t border-rose-500/30" };
    default:
      return { bg: "bg-sky-500/25", text: "text-sky-100", border: "border-t border-sky-500/30" };
  }
}

function BannerPreview({ variant, message, link }: { variant: "info"|"success"|"warning"|"error"; message: string; link?: string }) {
  const styles = bannerStyles(variant);
  return (
    <div className={`relative flex w-full items-stretch ${styles.border} shadow-[0_6px_20px_rgba(0,0,0,.35)]`}>
      <div className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-xs font-medium ${styles.bg} ${styles.text} backdrop-blur-xl supports-[backdrop-filter:blur(0px)]:backdrop-blur-xl`}>
        {link ? (
          <a href={link} className="truncate hover:underline" target="_blank" rel="noreferrer noopener">
            {message}
          </a>
        ) : (
          <span className="truncate">{message}</span>
        )}
      </div>
      <div className={`px-3 ${styles.bg} ${styles.text} backdrop-blur-xl supports-[backdrop-filter:blur(0px)]:backdrop-blur-xl`}>×</div>
    </div>
  );
}
