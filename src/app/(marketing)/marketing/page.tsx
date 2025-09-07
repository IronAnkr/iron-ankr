export default function MarketingDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Marketing Dashboard</h1>
        <p className="text-sm text-white/70">Manage campaigns, links, content, and banners.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickCard title="Campaigns" href="/marketing/campaigns" desc="Plan and track campaigns by channel." />
        <QuickCard title="Links" href="/marketing/links" desc="Create short links and track clicks." />
        <QuickCard title="Content" href="/marketing/content" desc="Plan and schedule content across platforms." />
        <QuickCard title="Banners" href="/marketing/banners" desc="Manage site-wide promo banners." />
      </div>
    </div>
  );
}

function QuickCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <a href={href} className="rounded-xl border border-white/10 bg-white/5 p-6 text-white hover:bg-white/10 transition-colors">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
    </a>
  );
}
