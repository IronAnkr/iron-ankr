"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

type RunResult = {
  ok?: boolean;
  error?: string;
  [k: string]: unknown;
};

export default function AdminFunctionsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Lightweight client-side gate for UX; API is owner-guarded server-side
  import("@/utils/supabase/client").then(({ getSupabaseBrowserClient }) => {
    const supa = getSupabaseBrowserClient();
    supa.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) { setAuthorized(false); return; }
      const { data: row } = await supa.from('app_users').select('role').eq('id', uid).maybeSingle();
      setAuthorized((row?.role || '').toLowerCase() === 'owner');
    }).catch(()=> setAuthorized(false));
  });

  async function runBackfill(dry: boolean) {
    setRunning(dry ? "backfill-dry" : "backfill");
    setResult(null);
    try {
      const res = await fetch(`/api/admin/backfill-customers?limit=200&dry=${dry ? 'true' : 'false'}` , { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setResult({ ok: true, ...json });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setResult({ ok: false, error: message || 'Failed to run' });
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Functions</h1>
          <p className="text-sm text-muted-foreground">One-off maintenance tasks and data utilities.</p>
        </div>
      </header>

      {authorized === false && (
        <div className="rounded-md border border-border/60 bg-card/60 p-3 text-sm text-amber-800 dark:text-amber-200">
          You don’t have access to this page. Owner role required.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Backfill Customers</CardTitle>
            <CardDescription>Link past orders to customers using Stripe Checkout session emails. Safe to run repeatedly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => runBackfill(true)}
                disabled={running !== null || authorized === false}
                className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground/90 hover:border-border disabled:opacity-60"
              >{running === 'backfill-dry' ? 'Running dry run…' : 'Dry run (no writes)'}</button>
              <button
                onClick={() => runBackfill(false)}
                disabled={running !== null || authorized === false}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:border-emerald-400/40 disabled:opacity-60"
              >{running === 'backfill' ? 'Backfilling…' : 'Run backfill'}</button>
            </div>
            {result && (
              <div className="mt-3 rounded-md border border-border/60 bg-card/60 p-3 text-xs text-foreground/80 overflow-auto">
                <div className="mb-2">{result.ok ? 'Completed' : 'Error'}</div>
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder for future utilities */}
        <Card className="overflow-hidden border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Recompute Analytics (coming soon)</CardTitle>
            <CardDescription>Rebuild precomputed metrics and caches for the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <button disabled className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground/60">Not implemented</button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
