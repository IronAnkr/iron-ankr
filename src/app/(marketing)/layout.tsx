import { FancyBackground } from "../components/admin/fancy-background";
import { AdminContainer } from "../components/admin/admin-container";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative flex flex-col min-h-screen pt-24 bg-background text-foreground overflow-x-hidden">
      <FancyBackground />
      <main className="relative z-10 flex-1 py-6 lg:py-8">
        <AdminContainer>
          <nav className="mb-4 flex flex-wrap gap-2 text-sm">
            <Link href="/marketing" className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10">Overview</Link>
            <Link href="/marketing/campaigns" className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10">Campaigns</Link>
            <Link href="/marketing/links" className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10">Links</Link>
            <Link href="/marketing/content" className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10">Content</Link>
            <Link href="/marketing/banners" className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10">Banners</Link>
          </nav>
          {children}
        </AdminContainer>
      </main>
    </div>
  );
}
