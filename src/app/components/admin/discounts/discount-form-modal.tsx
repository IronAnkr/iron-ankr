"use client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { type DiscountT } from "@/db/schema";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (d: DiscountT) => void;
  initial?: DiscountT | null;
};

export function DiscountFormModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<DiscountT>(
    initial ?? {
      id: "",
      code: "",
      type: "percent",
      value: 10,
      active: true,
      start_date: undefined,
      end_date: undefined,
      max_uses: undefined,
      uses_count: 0,
      product_ids: undefined,
      variant_ids: undefined,
      minimum_subtotal_in_cents: undefined,
      description: undefined,
      metadata: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }
  );
  const [valueInput, setValueInput] = useState<string>(String((initial?.value ?? 10)));

  useEffect(() => {
    if (initial) {
      setForm(initial);
      setValueInput(String(initial.value ?? 0));
    } else {
      setForm({
        id: "",
        code: "",
        type: "percent",
        value: 10,
        active: true,
        start_date: undefined,
        end_date: undefined,
        max_uses: undefined,
        uses_count: 0,
        product_ids: undefined,
        variant_ids: undefined,
        minimum_subtotal_in_cents: undefined,
        description: undefined,
        metadata: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      });
      setValueInput("10");
    }
  }, [initial]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Code is required";
    const parsed = valueInput.trim() === "" ? NaN : Number(valueInput);
    if (form.type === "percent") {
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) e.value = "Percent must be 1–100";
    } else {
      if (!Number.isFinite(parsed) || parsed <= 0) e.value = "Amount must be greater than 0";
    }
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) e.date = "End must be after start";
    if (form.max_uses !== undefined && form.max_uses! < 0) e.max_uses = "Must be 0 or more";
    return e;
  }, [form, valueInput]);

  function submit() {
    if (Object.keys(errors).length) return;
    const id = form.id || crypto.randomUUID();
    const parsed = Number(valueInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return; // final guard per request
    onSave({ ...form, value: parsed, id, updated_at: new Date().toISOString() });
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-4 md:p-6 text-white shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">{form.id ? "Edit Discount" : "Create Discount"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm text-white/90">Code</span>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER25"
              className={cn(
                "w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20",
                errors.code && "ring-2 ring-rose-400/40"
              )}
            />
            {errors.code && <span className="text-xs text-rose-300">{errors.code}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Type</span>
            <select
              value={form.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, type: e.target.value as DiscountT["type"] }))}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="percent">Percent %</option>
              <option value="amount">Fixed Amount</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Value {form.type === "percent" ? "(%)" : "($)"}</span>
            <input
              type="number"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              className={cn(
                "w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20",
                errors.value && "ring-2 ring-rose-400/40"
              )}
            />
            {errors.value && <span className="text-xs text-rose-300">{errors.value}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Max uses (optional)</span>
            <input
              type="number"
              value={form.max_uses ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value === "" ? undefined : Number(e.target.value) }))}
              className={cn(
                "w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20",
                errors.max_uses && "ring-2 ring-rose-400/40"
              )}
            />
            {errors.max_uses && <span className="text-xs text-rose-300">{errors.max_uses}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">Start date</span>
            <input
              type="date"
              value={form.start_date ? new Date(form.start_date).toISOString().slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value ? new Date(e.target.value) : undefined }))}
              className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-white/90">End date</span>
            <input
              type="date"
              value={form.end_date ? new Date(form.end_date).toISOString().slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value ? new Date(e.target.value) : undefined }))}
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

        <div className="mt-3">
          <label className="grid gap-1">
            <span className="text-sm text-white/90">Description (optional)</span>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || undefined }))}
              placeholder="Short note about this code, where it’s used, or eligibility."
              className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 min-h-20"
            />
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
