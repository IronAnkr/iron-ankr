"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type Link = {
  id: string;
  slug: string;
  destination: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  clicks: number;
  created_at: string;
};

export default function MarketingLinksPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [dest, setDest] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { isMarketingAdmin } = useMarketingAccess();

  type LinkRow = Link & { link_click_events?: { count: number }[] | null };
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_links")
      .select("id,slug,destination,utm_source,utm_medium,utm_campaign,utm_content,created_at, link_click_events(count)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    const mapped = ((data as LinkRow[]) || []).map((r: LinkRow) => ({
      id: r.id,
      slug: r.slug,
      destination: r.destination,
      utm_source: r.utm_source,
      utm_medium: r.utm_medium,
      utm_campaign: r.utm_campaign,
      utm_content: r.utm_content,
      created_at: r.created_at,
      clicks: r.link_click_events?.[0]?.count || 0,
    })) as Link[];
    setItems(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("marketing_links")
      .insert({
        slug: slug.trim(),
        destination: dest.trim(),
        utm_source: source || null,
        utm_medium: medium || null,
        utm_campaign: campaign || null,
        utm_content: content || null,
      })
      .select()
      .single();
    if (error) setError(error.message);
    if (data) setItems((prev) => [data as Link, ...prev]);
    setSlug(""); setDest(""); setSource(""); setMedium(""); setCampaign(""); setContent("");
    setSaving(false);
  }

  async function remove(id: string) {
    if (!isMarketingAdmin) return;
    if (!confirm("Delete this link?")) return;
    const { error } = await supabase.from("marketing_links").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Links</h1>
        <p className="text-sm text-muted-foreground">Create short links and track clicks.</p>
      </header>

      <form onSubmit={createLink} className="rounded-lg border border-border/60 bg-card/60 p-4 grid gap-3 md:grid-cols-2">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (unique)" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" required />
        <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="https://destination" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" required />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="utm_source" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" />
        <input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="utm_medium" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" />
        <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="utm_campaign" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" />
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="utm_content" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" />
        <div className="md:col-span-2">
          <button disabled={!slug.trim() || !dest.trim() || saving} className="rounded-md bg-foreground text-background hover:bg-foreground/90 px-3 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Create link'}</button>
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
                <th className="p-3 text-left">Slug</th>
                <th className="p-3 text-left">Destination</th>
                <th className="p-3">Clicks</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="p-3 text-left">{l.slug}</td>
                  <td className="p-3 text-left truncate max-w-[28ch] text-muted-foreground" title={l.destination}>{l.destination}</td>
                  <td className="p-3 text-center">{l.clicks}</td>
                  <td className="p-3 text-center">
                    {isMarketingAdmin && (
                      <button onClick={() => remove(l.id)} className="text-destructive hover:underline">Delete</button>
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
