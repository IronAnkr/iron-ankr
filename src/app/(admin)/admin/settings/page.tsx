"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import type { SettingT } from "@/db/schema";

type KV = Record<string, SettingT | undefined>;
function byKey(rows: SettingT[]): KV {
  const map: KV = {};
  for (const r of rows) map[r.key] = r;
  return map;
}

const ADMIN_SETTING_KEYS = [
  'site.store_name',
  'site.support_email',
  'shipping.domestic_flat_cents',
  'shipping.international_flat_cents',
  'theme.accent',
] as const;

export default function AdminSettingsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<SettingT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Narrow helper for extracting cents from JSON value
  const extractCents = (s: SettingT | undefined, fallback: number): number => {
    const val = s?.value as unknown;
    if (typeof val === 'object' && val !== null) {
      const rec = val as Record<string, unknown>;
      if (typeof rec.cents === 'number') return rec.cents;
    }
    return fallback;
  };

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .in('key', ADMIN_SETTING_KEYS as unknown as string[])
      .order('key', { ascending: true });
    if (error) setError(error.message);
    setRows((data as SettingT[] | null) ?? []);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const settings = byKey(rows);

  async function saveString(key: string, label: string, value_str: string, opts?: Partial<SettingT>) {
    setSaving((s) => ({ ...s, [key]: true }));
    const payload = {
      key,
      scope: (opts?.scope as string) ?? key.split('.')[0] ?? 'site',
      group_key: (opts?.group_key as string) ?? null,
      label,
      description: (opts?.description as string) ?? null,
      value: null,
      value_str,
      is_public: opts?.is_public ?? false,
      active: opts?.active ?? true,
    };
    const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'key' });
    if (error) alert(error.message);
    await load();
    setSaving((s) => ({ ...s, [key]: false }));
  }

  async function saveCents(key: string, label: string, cents: number, opts?: Partial<SettingT>) {
    setSaving((s) => ({ ...s, [key]: true }));
    const payload = {
      key,
      scope: (opts?.scope as string) ?? key.split('.')[0] ?? 'shipping',
      group_key: (opts?.group_key as string) ?? 'rates',
      label,
      description: (opts?.description as string) ?? null,
      value: { cents },
      value_str: null,
      is_public: opts?.is_public ?? false,
      active: opts?.active ?? true,
    };
    const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'key' });
    if (error) alert(error.message);
    await load();
    setSaving((s) => ({ ...s, [key]: false }));
  }

  // Local form state
  const [storeName, setStoreName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [domestic, setDomestic] = useState('5.00');
  const [international, setInternational] = useState('15.00');
  const [accent, setAccent] = useState('#66E3FF');

  useEffect(() => {
    setStoreName(settings['site.store_name']?.value_str ?? 'Iron ankr');
    setSupportEmail(settings['site.support_email']?.value_str ?? 'support@iron-ankr.com');
    setDomestic(String(extractCents(settings['shipping.domestic_flat_cents'], 500) / 100));
    setInternational(String(extractCents(settings['shipping.international_flat_cents'], 1500) / 100));
    setAccent(settings['theme.accent']?.value_str ?? '#66E3FF');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure store details, payments, and fulfillment.</p>
      </header>
      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Store</CardTitle>
            <CardDescription>Basic information for your storefront.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Store name</span>
                <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="Acme Co." />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Support email</span>
                <input value={supportEmail} onChange={(e)=>setSupportEmail(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="support@example.com" />
              </label>
              <div className="flex justify-end">
                <button type="button" onClick={()=> void Promise.all([
                  saveString('site.store_name','Store name', storeName, { scope:'site', group_key:'store', is_public: true }),
                  saveString('site.support_email','Support email', supportEmail, { scope:'site', group_key:'store' }),
                ])} className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition disabled:opacity-60" disabled={saving['site.store_name']||saving['site.support_email']}>
                  {saving['site.store_name']||saving['site.support_email'] ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
            <CardDescription>Default shipping speeds and rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Domestic flat rate</span>
                <input value={domestic} onChange={(e)=>setDomestic(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="$5.00" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-white/90">International flat rate</span>
                <input value={international} onChange={(e)=>setInternational(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" placeholder="$15.00" />
              </label>
              <div className="flex justify-end">
                <button type="button" onClick={()=> void Promise.all([
                  saveCents('shipping.domestic_flat_cents','Domestic flat rate (cents)', Math.round(Number(domestic||'0')*100), { scope:'shipping', group_key:'rates' }),
                  saveCents('shipping.international_flat_cents','International flat rate (cents)', Math.round(Number(international||'0')*100), { scope:'shipping', group_key:'rates' }),
                ])} className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition disabled:opacity-60" disabled={saving['shipping.domestic_flat_cents']||saving['shipping.international_flat_cents']}>
                  {saving['shipping.domestic_flat_cents']||saving['shipping.international_flat_cents'] ? 'Saving…' : 'Save shipping'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Brand colors and public UI preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-white/90">Accent color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e)=>setAccent(e.target.value)}
                    className="h-9 w-12 shrink-0 rounded-md border border-white/10 bg-white/5"
                  />
                  <input
                    value={accent}
                    onChange={(e)=>setAccent(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="#66E3FF"
                  />
                  <span className="inline-flex h-8 w-8 shrink-0 rounded-md border border-white/10" style={{ backgroundColor: accent }} />
                </div>
                <span className="text-xs text-white/50">Shown in public UI. Saved as a public setting.</span>
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={()=> void saveString('theme.accent','Theme accent color', accent, { scope:'theme', group_key:'brand', is_public: true })}
                  className="rounded-md bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/15 transition disabled:opacity-60"
                  disabled={saving['theme.accent']}
                >
                  {saving['theme.accent'] ? 'Saving…' : 'Save theme'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Permanently remove data. This action cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <div className="font-medium">Reset demo data</div>
                <div className="text-sm text-muted-foreground">Clears orders, products, and activity.</div>
              </div>
              <button className="rounded-md bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700 transition">Reset</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
