import { FancyBackground } from "../components/admin/fancy-background";
import { AdminContainer } from "../components/admin/admin-container";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="system-theme relative flex flex-col min-h-screen pt-24 bg-background text-foreground overflow-x-hidden">
      <FancyBackground />
      <main className="relative z-10 flex-1 py-6 lg:py-8">
        <AdminContainer>
          <nav className="mb-4 flex flex-wrap gap-2 text-sm">
            <Link href="/marketing" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Overview</Link>
            <Link href="/marketing/campaigns" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Campaigns</Link>
            <Link href="/marketing/links" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Links</Link>
            <Link href="/marketing/content" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Content</Link>
            <Link href="/marketing/banners" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Banners</Link>
            <Link href="/marketing/tasks" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Tasks</Link>
            <Link href="/marketing/approvals" className="rounded-md border px-3 py-1.5 border-border/60 bg-background/50 text-foreground hover:border-border">Approvals</Link>
          </nav>
          {children}
        </AdminContainer>
      </main>
    </div>
  );
}
