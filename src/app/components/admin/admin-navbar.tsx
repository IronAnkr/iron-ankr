"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

const ADMIN_LINKS = [
  { href:"/orders", label: "orders" },
  { href:"/products", label: "products" },
  { href:"/banners", label: "banners" },
  { href:"/discounts", label: "discounts" },
  { href:"/settings", label: "settings" },
]

export default function AdminNavbar(){
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  return(
    <nav className="fixed inset-x-4 top-4 z-50 h-16 backdrop-blur-md bg-black/70 border border-white/10 rounded-xl overflow-hidden flex items-center px-4 md:px-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <AdminLogo />
      <div className="hidden md:flex flex-1 items-center mx-4">
        <div className="relative w-full max-w-sm">
          <input
            placeholder="Search orders, customers, products..."
            className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <svg aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
      <Links pathname={pathname} />
      <AvatarChip />
      <button
        onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
        className="ml-3 hidden sm:inline-flex items-center rounded-md bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
      >
        Sign out
      </button>
    </nav>
  )
}

function AdminLogo(){
  return(
    <div className="flex items-center gap-2 text-white">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[10px] font-bold">IA</span>
      <h1 className="text-sm tracking-wide text-white/90">/admin</h1>
    </div>
  )
}

function Links ({ pathname }: { pathname: string | null }) {
  return(
      <ul className="hidden md:flex items-center gap-2 h-full px-4">
        {ADMIN_LINKS.map((link)=>{
          const href = `/admin/${link.href}`
          const active = pathname?.startsWith(href);

          return(
            <Link 
              className={`text-white/80 hover:text-white transition font-medium text-sm tracking-wide px-3 py-1.5 rounded-md ${active ? "bg-white/10 text-white" : "hover:bg-white/5"}`}
              href={href} 
              key={href}
            >
              {link.label}
            </Link>
          )
        })}
      </ul>
  )
}

function AvatarChip() {
  return (
    <div className="ml-auto md:ml-2 flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-xs text-white/70">
        <span className="hidden lg:inline">admin@iron-ankr</span>
      </div>
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400/70 to-pink-500/70 ring-2 ring-white/20 shadow" />
    </div>
  )
}
