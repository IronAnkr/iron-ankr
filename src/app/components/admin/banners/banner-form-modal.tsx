"use client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { type BannerMessageT } from "@/db/schema";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (b: BannerMessageT) => void;
  initial?: BannerMessageT | null;
};

export function BannerFormModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<BannerMessageT>(
    initial ?? {
      id: "",
      message: "",
      link_url: undefined,
      variant: "info",
      priority: 0,
      starts_at: undefined,
      ends_at: undefined,
      active: true,
      metadata: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }
  );

  useEffect(() => {
    if (initial) setForm(initial);
    else
      setForm({
        id: "",
        message: "",
        link_url: undefined,
        variant: "info",
        priority: 0,
        starts_at: undefined,
        ends_at: undefined,
        active: true,
        metadata: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      });
  }, [initial]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.message.trim()) e.message = "Message is required";
    if (form.link_url && !/^https?:\/\//.test(form.link_url)) e.link_url = "Must be a valid URL";
    if (form.starts_at && form.ends_at && new Date(form.starts_at) > new Date(form.ends_at)) e.date = "End must be after start";
    return e;
  }, [form]);

  function submit() {
    if (Object.keys(errors).length) return;
    const id = form.id || crypto.randomUUID();
    onSave({ ...form, id, updated_at: new Date().toISOString() });
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-4 md:p-6 text-white shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">{form.id ? "Edit Banner" : "Create Banner"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm text-white/90">Message</span>
            <input
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Holiday sale now live!"
              className={cn(
                "w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20",
                errors.message && "ring-2 ring-rose-400/40"
              )}
            />
            {errors.message && <span className="text-xs text-rose-300">{errors.message}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Variant</span>
            <select
              value={form.variant}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, variant: e.target.value as BannerMessageT["variant"] }))}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Priority</span>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>

          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm text-white/90">Link URL (optional)</span>
            <input
              value={form.link_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value || undefined }))}
              placeholder="https://example.com/sale"
              className={cn(
                "w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20",
                errors.link_url && "ring-2 ring-rose-400/40"
              )}
            />
            {errors.link_url && <span className="text-xs text-rose-300">{errors.link_url}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Start date</span>
            <input
              type="date"
              value={form.starts_at ? form.starts_at.slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">End date</span>
            <input
              type="date"
              value={form.ends_at ? form.ends_at.slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
              className={cn(
                "w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20",
                errors.date && "ring-2 ring-rose-400/40"
              )}
            />
            {errors.date && <span className="text-xs text-rose-300">{errors.date}</span>}
          </label>

          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            <span className="text-sm">Active</span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md bg-white/5 border border-white/10 hover:bg-white/10">Cancel</button>
          <button onClick={submit} disabled={Object.keys(errors).length>0} className="px-3 py-2 text-sm rounded-md bg-white/10 text-white hover:bg-white/15 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}
