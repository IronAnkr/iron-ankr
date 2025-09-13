"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { AdminSearchModal } from "./admin-search-modal";
import { Menu, X, LogOut, Home, Package, Settings, Percent, Megaphone, ClipboardList } from "lucide-react";

const ADMIN_LINKS = [
  { href:"/orders", label: "orders", Icon: ClipboardList },
  { href:"/products", label: "products", Icon: Package },
  { href:"/banners", label: "banners", Icon: Megaphone },
  { href:"/discounts", label: "discounts", Icon: Percent },
  { href:"/settings", label: "settings", Icon: Settings },
] as const;

export default function AdminNavbar(){
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return(
    <>
    <nav className="fixed inset-x-4 top-4 z-50 rounded-xl overflow-visible system-theme">
      <div className="h-16 backdrop-blur-md border rounded-xl overflow-hidden flex items-center px-4 md:px-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)] border-border/60 bg-background/70">
        <AdminLogo />

        {/* Search (desktop) */}
        <div className="hidden md:flex flex-1 items-center mx-4">
          <div className="relative w-full max-w-sm">
            <input
              placeholder="Search orders, customers, products..."
              className="w-full rounded-lg border px-9 py-2 text-sm focus:outline-none border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground cursor-pointer"
              readOnly
              onClick={() => setSearchOpen(true)}
            />
            <svg aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>

        {/* Desktop links moved to sidebar to reduce clutter */}

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="hidden sm:inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs border border-border/60 bg-background/50 text-foreground hover:border-border">
            <Home className="h-4 w-4" /> Return to site
          </Link>
          <AvatarChip />
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
            className="hidden sm:inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs border border-border/60 bg-background/50 text-foreground hover:border-border"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          {/* Mobile menu toggle */}
          <button
            className="inline-flex md:hidden items-center justify-center rounded-md border p-2 backdrop-blur border-border/60 bg-background/50 text-foreground hover:border-border"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div className="md:hidden overflow-hidden transition-[max-height,opacity]" style={{ maxHeight: open ? 320 : 0, opacity: open ? 1 : 0 }}>
        <div className="mt-2 rounded-xl border border-border/60 bg-card/80 backdrop-blur px-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            {ADMIN_LINKS.map(({ href, label, Icon }) => {
              const full = `/admin/${href}`;
              const active = pathname?.startsWith(full);
              return (
                <Link
                  key={full}
                  href={full}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-background/60 text-foreground' : 'bg-background/40 text-foreground/80 hover:border-border'}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Link href="/" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs border-border/60 bg-background/50 text-foreground hover:border-border">
              <Home className="h-4 w-4" /> Return to site
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs border-border/60 bg-background/50 text-foreground hover:border-border"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
    <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

function AdminLogo(){
  return(
    <div className="flex items-center gap-2 text-foreground">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground/10 text-[10px] font-bold">IA</span>
      <h1 className="text-sm tracking-wide text-foreground/90">/admin</h1>
    </div>
  )
}

// Desktop links were moved to the sidebar; keeping navbar minimal

function AvatarChip() {
  return (
    <div className="ml-auto md:ml-2 flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden lg:inline">admin@iron-ankr</span>
      </div>
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400/70 to-pink-500/70 ring-2 ring-foreground/20 shadow" />
    </div>
  )
}
