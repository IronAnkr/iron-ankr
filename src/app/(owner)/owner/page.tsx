import Link from "next/link";

export default function OwnerDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Owner Dashboard</h1>
          <p className="text-sm text-white/70">Oversee your store, teams, and systems at a glance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10">Today</button>
          <button className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10">7 days</button>
          <button className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10">30 days</button>
          <button className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10">Custom…</button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: "Revenue", value: "$—", sub: "+0.0% vs prev" },
          { label: "Orders", value: "—", sub: "0 pending" },
          { label: "Active Users", value: "—", sub: "last 24h" },
          { label: "Conversion", value: "—", sub: "sitewide" },
          { label: "Avg Order", value: "$—", sub: "cart size" },
          { label: "Refunds", value: "—", sub: "this period" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
            <div className="text-xs uppercase tracking-wide text-white/60">{kpi.label}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{kpi.value}</div>
            <div className="mt-1 text-xs text-white/50">{kpi.sub}</div>
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Quick actions</h2>
          <div className="text-xs text-white/60">No-op placeholders for now</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Invite team member", href: "/owner/teams" },
            { label: "Create marketing link", href: "/marketing" },
            { label: "New product", href: "/admin" },
            { label: "Manage discounts", href: "/admin" },
            { label: "View logs", href: "/admin" },
            { label: "Configure webhooks", href: "/admin" },
          ].map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Charts + Funnel */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Traffic & Sales (placeholder)</h3>
            <div className="text-xs text-white/60">Last 30 days</div>
          </div>
          <div className="mt-4 h-56 rounded-lg border border-white/10 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.08)_0_1px,transparent_1px_40px)]">
            <div className="h-full w-full grid place-content-center text-white/50 text-sm">Chart placeholder</div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-white">Conversion funnel</h3>
          <div className="mt-4 space-y-3">
            {[
              { label: "Visits", pct: 100 },
              { label: "Product views", pct: 62 },
              { label: "Adds to cart", pct: 23 },
              { label: "Checkout", pct: 12 },
              { label: "Purchased", pct: 7 },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-white/70">
                  <span>{r.label}</span>
                  <span>{r.pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded bg-white/10">
                  <div className="h-2 rounded bg-white/40" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity + Orders */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent activity</h3>
            <button className="text-xs text-white/70 hover:text-white">View all</button>
          </div>
          <ul className="mt-3 divide-y divide-white/10">
            {[
              { t: "Team", d: "Invited alex@ to Marketing team" },
              { t: "Orders", d: "Refund requested for #1042" },
              { t: "Products", d: "Updated inventory for Straps Pro" },
              { t: "Billing", d: "Invoice INV-2023-09 generated" },
              { t: "System", d: "Webhook delivery succeeded (stripe.payment_succeeded)" },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 py-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/60" />
                <div>
                  <div className="text-sm text-white/90">{item.d}</div>
                  <div className="text-xs text-white/50">{item.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">System status</h3>
          <div className="mt-3 space-y-2 text-sm">
            {[
              { name: "Database (Supabase)", ok: true },
              { name: "Edge Middleware", ok: true },
              { name: "Email provider", ok: true },
              { name: "Third-party APIs", ok: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-white/90">{s.name}</span>
                <span className={`inline-flex items-center gap-2 text-xs ${s.ok ? "text-emerald-300" : "text-rose-300"}`}>
                  <span className={`h-2 w-2 rounded-full ${s.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                  {s.ok ? "Operational" : "Issues"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teams & Permissions, Billing, Integrations, Feature Flags */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-white">Teams & permissions</h3>
          <p className="mt-2 text-sm text-white/70">Manage roles across your organization.</p>
          <div className="mt-4">
            <Link href="/owner/teams" className="rounded-md bg-white text-black px-3 py-2 text-sm font-semibold hover:bg-zinc-200">Manage Teams</Link>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-white">Billing</h3>
          <p className="mt-2 text-sm text-white/70">View invoices and payment methods.</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">View billing</button>
            <button className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">Update card</button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-white">Integrations</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {['Stripe','Klaviyo','Shopify','Slack'].map((name) => (
              <button key={name} className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white/90 hover:bg-white/10">{name}</button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-white">Feature flags</h3>
          <div className="mt-3 space-y-3 text-sm">
            {[
              { name: 'New checkout', on: false },
              { name: 'Inventory v2', on: false },
              { name: 'A/B banners', on: true },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-white/90">{f.name}</span>
                <span className={`inline-flex items-center gap-2 text-xs ${f.on ? 'text-emerald-300' : 'text-white/50'}`}>{f.on ? 'On' : 'Off'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tables */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent orders</h3>
            <button className="text-xs text-white/70 hover:text-white">Export</button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-4 text-left font-medium">Order</th>
                  <th className="py-2 pr-4 text-left font-medium">Customer</th>
                  <th className="py-2 pr-4 text-left font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/10">
                    <td className="py-2 pr-4">#10{i + 1}</td>
                    <td className="py-2 pr-4">—</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2 text-xs text-white/70">
                        <span className="h-2 w-2 rounded-full bg-white/40" />
                        Pending
                      </span>
                    </td>
                    <td className="py-2 text-right">$—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Tasks</h3>
            <button className="text-xs text-white/70 hover:text-white">View all</button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              'Review low inventory SKUs',
              'Approve marketing link UTM plan',
              'Reconcile refund queue',
              'Verify webhook retries',
              'Check monthly P&L',
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="h-4 w-4 rounded border border-white/20 bg-white/5" />
                <span className="text-white/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
