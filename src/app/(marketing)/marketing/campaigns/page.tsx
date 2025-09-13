"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  budget_cents: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  created_at: string;
};

export default function MarketingCampaignsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("email");
  const [budget, setBudget] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { isMarketingAdmin } = useMarketingAccess();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("id,name,channel,budget_cents,starts_at,ends_at,status,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setItems((data as Campaign[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const budget_cents = budget ? Math.round(parseFloat(budget) * 100) : null;
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({ name: name.trim(), channel, budget_cents })
      .select()
      .single();
    if (error) setError(error.message);
    if (data) setItems((prev) => [data as Campaign, ...prev]);
    setName(""); setChannel("email"); setBudget("");
    setSaving(false);
  }

  async function remove(id: string) {
    if (!isMarketingAdmin) return;
    if (!confirm("Delete this campaign?")) return;
    const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground">Plan and track campaigns by channel.</p>
      </header>

      <form onSubmit={createCampaign} className="rounded-lg border border-border/60 bg-card/60 p-4 grid gap-3 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" required />
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="organic">Organic</option>
          <option value="influencer">Influencer</option>
          <option value="ads">Ads</option>
        </select>
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (e.g. 250.00)" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" />
        <div className="sm:col-span-3">
          <button disabled={!name.trim() || saving} className="rounded-md bg-foreground text-background hover:bg-foreground/90 px-3 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Create campaign'}</button>
        </div>
      </form>

      {error && <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>}
      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm text-foreground/90">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 text-left">{c.name}</td>
                  <td className="p-3 text-center uppercase text-muted-foreground">{c.channel}</td>
                  <td className="p-3 text-center">{c.budget_cents ? `$${(c.budget_cents/100).toFixed(2)}` : '—'}</td>
                  <td className="p-3 text-center text-muted-foreground">{c.status}</td>
                  <td className="p-3 text-center">
                    {isMarketingAdmin && (
                      <button onClick={() => remove(c.id)} className="text-destructive hover:underline">Delete</button>
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
