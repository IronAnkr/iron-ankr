"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type Item = { title: string; href: string; section: string; keywords?: string[] };

function adminItems(): Item[] {
  return [
    { title: "Admin Dashboard", href: "/admin", section: "Admin", keywords: ["overview","metrics","dashboard"] },
    { title: "Analytics", href: "/admin/analytics", section: "Admin", keywords: ["traffic","views","visitors","insights","kpi"] },
    { title: "Orders", href: "/admin/orders", section: "Admin", keywords: ["payments","transactions","stripe","checkout","sales"] },
    { title: "Fulfillment", href: "/admin/fulfillment", section: "Admin", keywords: ["shipping","packing","labels","warehouse"] },
    { title: "Products", href: "/admin/products", section: "Admin", keywords: ["catalog","inventory","variants","price","sku"] },
    { title: "Discounts", href: "/admin/discounts", section: "Admin", keywords: ["coupon","promo","sale","code","marketing"] },
    { title: "Banners", href: "/admin/banners", section: "Admin", keywords: ["announcement","notification","campaign"] },
    { title: "Messages", href: "/admin/messages", section: "Admin", keywords: ["contact","inbox","support","leads"] },
    { title: "Settings", href: "/admin/settings", section: "Admin", keywords: ["configuration","site","legal","shipping"] },
    { title: "Functions", href: "/admin/functions", section: "Admin", keywords: ["jobs","maintenance","backfill","tools"] },
  ];
}

function marketingItems(): Item[] {
  return [
    { title: "Marketing Dashboard", href: "/marketing", section: "Marketing", keywords: ["overview","campaigns"] },
    { title: "Tasks", href: "/marketing/tasks", section: "Marketing", keywords: ["todo","kanban","work"] },
    { title: "Content", href: "/marketing/content", section: "Marketing", keywords: ["posts","assets","copy"] },
    { title: "Banners", href: "/marketing/banners", section: "Marketing", keywords: ["announcement","placement"] },
    { title: "Links", href: "/marketing/links", section: "Marketing", keywords: ["utm","tracking","referrals","shortlinks"] },
    { title: "Campaigns", href: "/marketing/campaigns", section: "Marketing", keywords: ["email","ads","social"] },
    { title: "Approvals", href: "/marketing/approvals", section: "Marketing", keywords: ["review","workflow"] },
  ];
}

function fuzzyScore(query: string, text: string): number {
  if (!query) return 9999;
  let qi = 0;
  let score = 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let lastMatch = -1;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += lastMatch >= 0 ? (i - lastMatch - 1) : i;
      lastMatch = i;
      qi++;
    }
  }
  return qi === q.length ? score : Infinity;
}

export function AdminSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>(adminItems());

  useEffect(() => {
    if (!open) return;
    const supa = getSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supa.auth.getUser();
        const uid = data.user?.id;
        if (!uid) { setItems(adminItems()); return; }
        const { data: roleRow } = await supa.from('app_users').select('role').eq('id', uid).maybeSingle();
        const role = (roleRow?.role || '').toLowerCase();
        const withMarketing = role === 'owner' || role === 'admin';
        setItems([
          ...adminItems(),
          ...(withMarketing ? marketingItems() : []),
        ]);
      } catch {
        setItems(adminItems());
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query) return items.slice(0, 12);
    const scored = items
      .map((it) => ({ it, s: Math.min(
        fuzzyScore(query, it.title),
        fuzzyScore(query, `${it.section} ${it.title}`),
        fuzzyScore(query, it.href),
        fuzzyScore(query, (it.keywords || []).join(" "))
      ) }))
      .filter(r => isFinite(r.s))
      .sort((a, b) => a.s - b.s)
      .slice(0, 12)
      .map(r => r.it);
    return scored;
  }, [items, query]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[100000] system-theme">
      <div className="fixed inset-0 backdrop-blur-md bg-[hsl(var(--background)/0.6)]" onClick={onClose} />
      <div className="fixed inset-0 z-[100001] flex items-start justify-center pt-24 px-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin pages, keywords…"
              className="w-full bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button onClick={onClose} aria-label="Close" className="rounded-md border border-border/60 bg-background/50 p-1 text-foreground hover:border-border">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-auto">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">No matches.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {results.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      onClick={onClose}
                      className="flex items-center justify-between px-4 py-3 hover:bg-background/50"
                    >
                      <div>
                        <div className="text-sm text-foreground">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.href}</div>
                      </div>
                      <span className="rounded-md border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">{r.section}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
