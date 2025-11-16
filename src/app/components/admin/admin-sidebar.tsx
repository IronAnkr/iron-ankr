"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, Megaphone, Package, Percent, Settings, Truck, Wrench, Inbox, BarChart3 } from "lucide-react";

const LINKS = [
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { href: "/admin/messages", label: "Messages", Icon: Inbox },
  { href: "/admin/fulfillment", label: "Fulfillment", Icon: Truck },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/banners", label: "Banners", Icon: Megaphone },
  { href: "/admin/discounts", label: "Discounts", Icon: Percent },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/functions", label: "Functions", Icon: Wrench },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:block w-[260px] shrink-0 system-theme">
      <div className="sticky top-24 space-y-3">
        <Link href="/" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm border-border/60 bg-background/50 text-foreground hover:border-border">
          <Home className="h-4 w-4" /> Return to site
        </Link>
        <nav className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-2">
          <ul className="grid gap-1">
            {LINKS.map(({ href, label, Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? 'bg-background/60 text-foreground' : 'text-foreground/80 hover:bg-background/50 hover:text-foreground'}`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
          Tip: Use the top search to quickly jump to orders, products, and customers.
        </div>
      </div>
    </aside>
  );
}
