import Link from "next/link";

export default function OwnerDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Owner Dashboard</h1>
        <p className="text-sm text-white/70">Full access to store operations and settings.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white">
          <div className="text-sm text-white/80">This is a placeholder owner dashboard. We can surface admin analytics, team management, billing, and advanced settings here.</div>
          <div className="mt-4">
            <Link href="/owner/teams" className="text-blue-400 hover:underline">
              Manage Teams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

