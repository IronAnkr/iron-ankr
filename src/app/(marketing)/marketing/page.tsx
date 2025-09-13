"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type LinkRow = {
  id: string;
  slug: string;
  destination: string;
  created_at: string;
  link_click_events?: { count: number }[] | null;
};
type LinkSummary = { id: string; slug: string; destination: string; clicks: number };

type Campaign = { id: string; name: string; channel: string; status: string; budget_cents: number | null };
type Post = { id: string; title: string; platform: string; publish_at: string | null; status: string };

export default function MarketingDashboardPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { isMarketingAdmin } = useMarketingAccess();

  // Overview data
  const [topLinks, setTopLinks] = useState<LinkSummary[]>([]);
  const [upcomingContent, setUpcomingContent] = useState<Post[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick create states
  const [creating, setCreating] = useState<{ link?: boolean; campaign?: boolean; post?: boolean; banner?: boolean }>({});
  const [qSlug, setQSlug] = useState("");
  const [qDest, setQDest] = useState("");
  const [qCampaignName, setQCampaignName] = useState("");
  const [qCampaignChannel, setQCampaignChannel] = useState("email");
  const [qPostTitle, setQPostTitle] = useState("");
  const [qPostPlatform, setQPostPlatform] = useState("ig");
  const [qBannerMessage, setQBannerMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const nowIso = new Date().toISOString();
      const weekOutIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const [linksRes, postsRes, campsRes] = await Promise.all([
        supabase
          .from("marketing_links")
          .select("id,slug,destination,created_at,link_click_events(count)")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_posts")
          .select("id,title,platform,status,publish_at")
          .gte("publish_at", nowIso)
          .lte("publish_at", weekOutIso)
          .order("publish_at", { ascending: true }),
        supabase
          .from("marketing_campaigns")
          .select("id,name,channel,status,budget_cents")
          .neq("status", "done")
          .order("created_at", { ascending: false })
      ]);

      const linkRows = (linksRes.data as LinkRow[] | null) ?? [];
      const summarized = linkRows
        .map((r) => ({ id: r.id, slug: r.slug, destination: r.destination, clicks: r.link_click_events?.[0]?.count ?? 0 }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);
      setTopLinks(summarized);
      setUpcomingContent((postsRes.data as Post[] | null) ?? []);
      setActiveCampaigns((campsRes.data as Campaign[] | null) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  // Quick create handlers
  async function quickCreateLink(e: React.FormEvent) {
    e.preventDefault(); if (!qSlug.trim() || !qDest.trim()) return; setCreating((c) => ({ ...c, link: true })); setError(null);
    try {
      const { error } = await supabase.from("marketing_links").insert({ slug: qSlug.trim(), destination: qDest.trim() });
      if (error) throw error;
      setQSlug(""); setQDest("");
      void load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create link"); }
    finally { setCreating((c) => ({ ...c, link: false })); }
  }

  async function quickCreateCampaign(e: React.FormEvent) {
    e.preventDefault(); if (!qCampaignName.trim()) return; setCreating((c) => ({ ...c, campaign: true })); setError(null);
    try {
      const { error } = await supabase.from("marketing_campaigns").insert({ name: qCampaignName.trim(), channel: qCampaignChannel });
      if (error) throw error;
      setQCampaignName(""); setQCampaignChannel("email");
      void load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create campaign"); }
    finally { setCreating((c) => ({ ...c, campaign: false })); }
  }

  async function quickCreatePost(e: React.FormEvent) {
    e.preventDefault(); if (!qPostTitle.trim()) return; setCreating((c) => ({ ...c, post: true })); setError(null);
    try {
      const { error } = await supabase.from("content_posts").insert({ title: qPostTitle.trim(), platform: qPostPlatform });
      if (error) throw error;
      setQPostTitle(""); setQPostPlatform("ig");
      void load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create post"); }
    finally { setCreating((c) => ({ ...c, post: false })); }
  }

  async function quickCreateBanner(e: React.FormEvent) {
    e.preventDefault(); if (!qBannerMessage.trim()) return; setCreating((c) => ({ ...c, banner: true })); setError(null);
    try {
      const { error } = await supabase.from("banner_messages").insert({ id: crypto.randomUUID(), message: qBannerMessage.trim(), active: true });
      if (error) throw error;
      setQBannerMessage("");
      void load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create banner"); }
    finally { setCreating((c) => ({ ...c, banner: false })); }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketing Dashboard</h1>
        <p className="text-sm text-muted-foreground">Plan, create, and track in one place.</p>
      </header>

      {/* KPI placeholders */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { k: "Sessions", v: "—", s: "GA4" },
          { k: "CTR", v: "—", s: "Top links" },
          { k: "Leads", v: "—", s: "Forms" },
          { k: "Conv.", v: "—", s: "Sitewide" },
          { k: "Revenue", v: "$—", s: "Orders" },
          { k: "CPA", v: "$—", s: "Ad spend" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{x.k}</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{x.v}</div>
            <div className="text-[11px] text-muted-foreground">{x.s}</div>
          </div>
        ))}
      </section>

      {/* Quick create row */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="text-sm font-semibold text-foreground">Quick link</div>
          <form onSubmit={quickCreateLink} className="mt-3 grid gap-2">
            <input value={qSlug} onChange={(e) => setQSlug(e.target.value)} placeholder="slug (unique)" className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none" required />
            <input value={qDest} onChange={(e) => setQDest(e.target.value)} placeholder="https://destination" className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none" required />
            <div className="flex items-center justify-between gap-2">
              <button disabled={!isMarketingAdmin || creating.link || !qSlug.trim() || !qDest.trim()} className="rounded-md px-3 py-2 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60">{creating.link ? 'Saving…' : 'Create'}</button>
              <Link href="/marketing/links" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Manage</Link>
            </div>
          </form>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="text-sm font-semibold text-foreground">Quick campaign</div>
          <form onSubmit={quickCreateCampaign} className="mt-3 grid gap-2">
            <input value={qCampaignName} onChange={(e) => setQCampaignName(e.target.value)} placeholder="Campaign name" className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none" required />
            <select value={qCampaignChannel} onChange={(e) => setQCampaignChannel(e.target.value)} className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground focus:outline-none">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="organic">Organic</option>
              <option value="influencer">Influencer</option>
              <option value="ads">Ads</option>
            </select>
            <div className="flex items-center justify-between gap-2">
              <button disabled={!isMarketingAdmin || creating.campaign || !qCampaignName.trim()} className="rounded-md px-3 py-2 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60">{creating.campaign ? 'Saving…' : 'Create'}</button>
              <Link href="/marketing/campaigns" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Manage</Link>
            </div>
          </form>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="text-sm font-semibold text-foreground">Quick post</div>
          <form onSubmit={quickCreatePost} className="mt-3 grid gap-2">
            <input value={qPostTitle} onChange={(e) => setQPostTitle(e.target.value)} placeholder="Post title" className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none" required />
            <select value={qPostPlatform} onChange={(e) => setQPostPlatform(e.target.value)} className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground focus:outline-none">
              <option value="ig">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="yt">YouTube</option>
              <option value="email">Email</option>
              <option value="site">Site</option>
              <option value="blog">Blog</option>
            </select>
            <div className="flex items-center justify-between gap-2">
              <button disabled={!isMarketingAdmin || creating.post || !qPostTitle.trim()} className="rounded-md px-3 py-2 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60">{creating.post ? 'Saving…' : 'Create'}</button>
              <Link href="/marketing/content" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Manage</Link>
            </div>
          </form>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="text-sm font-semibold text-foreground">Quick banner</div>
          <form onSubmit={quickCreateBanner} className="mt-3 grid gap-2">
            <input value={qBannerMessage} onChange={(e) => setQBannerMessage(e.target.value)} placeholder="Promo message" className="rounded-md px-3 py-2 text-sm border border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none" required />
            <div className="flex items-center justify-between gap-2">
              <button disabled={!isMarketingAdmin || creating.banner || !qBannerMessage.trim()} className="rounded-md px-3 py-2 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60">{creating.banner ? 'Saving…' : 'Create'}</button>
              <Link href="/marketing/banners" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Manage</Link>
            </div>
          </form>
        </div>
      </section>

      {error && <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>}

      {/* Lower panels: Top Links, Upcoming Content, Active Campaigns */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Top links</h3>
            <Link href="/marketing/links" className="text-xs text-muted-foreground hover:underline hover:text-foreground">View all</Link>
          </div>
          {loading ? (
            <div className="mt-3 text-muted-foreground">Loading…</div>
          ) : topLinks.length === 0 ? (
            <div className="mt-3 text-muted-foreground">No links yet.</div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {topLinks.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">/{l.slug}</div>
                    <div className="truncate text-muted-foreground max-w-[40ch]" title={l.destination}>{l.destination}</div>
                  </div>
                  <div className="text-foreground/80">{l.clicks}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">This week</h3>
            <Link href="/marketing/content" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Content</Link>
          </div>
          {loading ? (
            <div className="mt-3 text-muted-foreground">Loading…</div>
          ) : upcomingContent.length === 0 ? (
            <div className="mt-3 text-muted-foreground">No scheduled content.</div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {upcomingContent.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.title}</div>
                    <div className="text-muted-foreground">{p.platform.toUpperCase()} • {p.publish_at ? new Date(p.publish_at).toLocaleString() : 'TBD'}</div>
                  </div>
                  <div className="text-muted-foreground">{p.status}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Active campaigns</h3>
            <Link href="/marketing/campaigns" className="text-xs text-muted-foreground hover:underline hover:text-foreground">Manage</Link>
          </div>
          {loading ? (
            <div className="mt-3 text-muted-foreground">Loading…</div>
          ) : activeCampaigns.length === 0 ? (
            <div className="mt-3 text-muted-foreground">No active campaigns.</div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {activeCampaigns.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="text-muted-foreground">{c.channel.toUpperCase()}</div>
                  </div>
                  <div className="text-muted-foreground">{c.status}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
