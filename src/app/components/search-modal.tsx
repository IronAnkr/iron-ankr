"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type Item = { title: string; href: string; section: string };

function baseItems(): Item[] {
  return [
    { title: "Home", href: "/", section: "Public" },
    { title: "Products", href: "/products", section: "Public" },
    { title: "About", href: "/about", section: "Public" },
    { title: "FAQ", href: "/faq", section: "Public" },
    { title: "Contact", href: "/contact", section: "Public" },
    { title: "Cart", href: "/cart", section: "Public" },
    { title: "Privacy Policy", href: "/privacy", section: "Public" },
    { title: "Terms of Service", href: "/terms", section: "Public" },
    { title: "Cookie Policy", href: "/cookies", section: "Public" },
    { title: "Login", href: "/login", section: "Auth" },
    { title: "Register", href: "/register", section: "Auth" },
    { title: "My Account", href: "/account", section: "Account" },
    { title: "My Orders", href: "/account/orders", section: "Account" },
    { title: "Account Settings", href: "/account/settings", section: "Account" },
  ];
}

function ownerItems(): Item[] {
  return [
    { title: "Owner Dashboard", href: "/owner", section: "Owner" },
    { title: "Teams", href: "/owner/teams", section: "Owner" },
  ];
}

function adminItems(): Item[] {
  return [
    { title: "Admin Dashboard", href: "/admin", section: "Admin" },
    { title: "Orders", href: "/admin/orders", section: "Admin" },
    { title: "Fulfillment", href: "/admin/fulfillment", section: "Admin" },
    { title: "Products", href: "/admin/products", section: "Admin" },
    { title: "Discounts", href: "/admin/discounts", section: "Admin" },
    { title: "Banners", href: "/admin/banners", section: "Admin" },
    { title: "Settings", href: "/admin/settings", section: "Admin" },
    { title: "Functions", href: "/admin/functions", section: "Admin" },
  ];
}

function marketingItems(): Item[] {
  return [
    { title: "Marketing Dashboard", href: "/marketing", section: "Marketing" },
    { title: "Tasks", href: "/marketing/tasks", section: "Marketing" },
    { title: "Content", href: "/marketing/content", section: "Marketing" },
    { title: "Banners", href: "/marketing/banners", section: "Marketing" },
    { title: "Links", href: "/marketing/links", section: "Marketing" },
    { title: "Campaigns", href: "/marketing/campaigns", section: "Marketing" },
    { title: "Approvals", href: "/marketing/approvals", section: "Marketing" },
  ];
}

function fuzzyScore(query: string, text: string): number {
  // Simple subsequence score: lower is better
  if (!query) return 9999;
  let qi = 0;
  let score = 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let lastMatch = -1;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += lastMatch >= 0 ? (i - lastMatch - 1) : i; // gap penalty
      lastMatch = i;
      qi++;
    }
  }
  return qi === q.length ? score : Infinity;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>(baseItems());

  useEffect(() => {
    if (!open) return;
    const supa = getSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supa.auth.getUser();
        const uid = data.user?.id;
        if (!uid) { setItems(baseItems()); return; }
        const { data: roleRow } = await supa.from('app_users').select('role').eq('id', uid).maybeSingle();
        const role = (roleRow?.role || '').toLowerCase();
        const withAdmin = role === 'owner' || role === 'admin';
        const withOwner = role === 'owner';
        // Marketing access detection (simplified: owners/admins)
        const withMarketing = role === 'owner' || role === 'admin';
        setItems([
          ...baseItems(),
          ...(withOwner ? ownerItems() : []),
          ...(withAdmin ? adminItems() : []),
          ...(withMarketing ? marketingItems() : []),
        ]);
      } catch {
        setItems(baseItems());
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
        fuzzyScore(query, it.section + ' ' + it.title),
        fuzzyScore(query, it.href)
      ) }))
      .filter(r => isFinite(r.s))
      .sort((a, b) => a.s - b.s)
      .slice(0, 12)
      .map(r => r.it);
    return scored;
  }, [items, query]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[100000]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="fixed inset-0 z-[100001] flex items-start justify-center pt-24 px-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-4 w-4 text-white/70" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-full bg-transparent px-1 py-2 text-sm text-white placeholder-white/40 focus:outline-none"
            />
            <button onClick={onClose} aria-label="Close" className="rounded-md border border-white/10 bg-white/5 p-1 text-white/80 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-auto">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/70">No matches.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {results.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      onClick={onClose}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
                    >
                      <div>
                        <div className="text-sm text-white">{r.title}</div>
                        <div className="text-xs text-white/60">{r.href}</div>
                      </div>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">{r.section}</span>
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
