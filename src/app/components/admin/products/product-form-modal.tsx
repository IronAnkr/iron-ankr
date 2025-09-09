"use client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { type ProductT } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (p: ProductT) => void;
  initial?: ProductT | null;
};

export function ProductFormModal({ open, onClose, onSave, initial }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("19.99"); // dollars
  const [status, setStatus] = useState<ProductT["status"]>("active");
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [replaceImages, setReplaceImages] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || "");
      setPrice(((initial.price_in_cents ?? 0) / 100).toFixed(2));
      setStatus(initial.status);
    } else {
      setName(""); setDescription(""); setPrice("19.99"); setStatus("active");
    }
    setFiles(null); setReplaceImages(false);
  }, [open, initial]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    const p = Number(price);
    if (!(p >= 0)) e.price = "Enter a valid price";
    return e;
  }, [name, price]);

  async function save() {
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      const id = initial?.id ?? crypto.randomUUID();
      const price_in_cents = Math.round(Number(price) * 100);
      const uploads: string[] = [];
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const path = `${id}/${i}-${Date.now()}-${f.name}`;
          const up = await supabase.storage.from("products").upload(path, f, { upsert: false });
          if (up.error) throw up.error;
          // With public read policy in place, use public URL (static, non-expiring)
          const { data } = supabase.storage.from("products").getPublicUrl(path);
          if (data?.publicUrl) uploads.push(data.publicUrl);
        }
      }
      const images = (() => {
        const current = initial?.images ?? [];
        if (uploads.length === 0) return current;
        return replaceImages ? uploads : [...current, ...uploads];
      })();

      if (initial) {
        const update = await supabase
          .from("products")
          .update({
            name: name.trim(),
            description: description.trim(),
            status,
            price_in_cents,
            images,
          })
          .eq("id", id)
          .select("id,name,description,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
          .single();
        if (update.error) throw update.error;
        onSave(update.data as ProductT);
      } else {
        const insert = await supabase
          .from("products")
          .insert({
            id,
            name: name.trim(),
            description: description.trim(),
            status,
            price_in_cents,
            images,
          })
          .select("id,name,description,status,price_in_cents,images,tags,metadata,created_at,updated_at,deleted_at")
          .single();
        if (insert.error) throw insert.error;
        onSave(insert.data as ProductT);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-5 text-white shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">{initial ? 'Edit Product' : 'Create Product'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm text-white/90">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn("w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20", errors.name && "ring-2 ring-rose-400/40")}
              placeholder="Iron ankr straps"
            />
            {errors.name && <span className="text-xs text-rose-300">{errors.name}</span>}
          </label>

          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm text-white/90">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 min-h-24"
              placeholder="Short description"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Price (USD)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className={cn("w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20", errors.price && "ring-2 ring-rose-400/40")}
            />
            {errors.price && <span className="text-xs text-rose-300">{errors.price}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProductT["status"]) }
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm text-white/90">Images</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm" />
            <span className="text-xs text-white/60">Uploads to bucket &quot;products&quot;. First image used as cover.</span>
            {initial && initial.images?.length ? (
              <div className="mt-2 text-xs text-white/70">
                Current images: {initial.images.length}. 
                <label className="ml-2 inline-flex items-center gap-1">
                  <input type="checkbox" checked={replaceImages} onChange={(e)=>setReplaceImages(e.target.checked)} className="h-3.5 w-3.5" />
                  Replace existing images
                </label>
              </div>
            ) : null}
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md bg-white/5 border border-white/10 hover:bg-white/10">Cancel</button>
          <button onClick={save} disabled={saving || Object.keys(errors).length>0} className="px-3 py-2 text-sm rounded-md bg-white/10 text-white hover:bg-white/15 disabled:opacity-50">{saving ? 'Saving…' : (initial ? 'Save' : 'Create')}</button>
        </div>
      </div>
    </div>
  );
}
