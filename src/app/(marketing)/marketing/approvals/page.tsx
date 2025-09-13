"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type ApprovalStatus = "pending" | "approved" | "rejected";
type Approval = {
  id: string;
  entity_type: string; // e.g., 'banner' | 'content' | 'campaign' | 'link'
  entity_id: string;
  status: ApprovalStatus;
  requested_by: string | null;
  decided_by: string | null;
  created_at: string;
};

export default function MarketingApprovalsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { isMarketingAdmin } = useMarketingAccess();

  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("marketing_approvals")
        .select("id,entity_type,entity_id,status,requested_by,decided_by,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as Approval[] | null) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, status: Exclude<ApprovalStatus, "pending">) {
    if (!isMarketingAdmin) return;
    try {
      const { data: me } = await supabase.auth.getUser();
      const decided_by = me.user?.id || null;
      const { error } = await supabase
        .from("marketing_approvals")
        .update({ status, decided_by })
        .eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status, decided_by } : a)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update approval");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Approvals</h1>
        <p className="text-sm text-muted-foreground">Review and approve marketing changes.</p>
      </header>

      {error && <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>}

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm text-foreground/90">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 text-left">
                    <div className="font-medium">{a.entity_type.toUpperCase()}</div>
                    <div className="text-muted-foreground text-xs">{a.entity_id}</div>
                  </td>
                  <td className="p-3 text-center">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-3 text-center uppercase text-muted-foreground">{a.status}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    {isMarketingAdmin && a.status === 'pending' && (
                      <>
                        <button onClick={() => decide(a.id, 'approved')} className="hover:underline text-emerald-700 dark:text-emerald-300">Approve</button>
                        <button onClick={() => decide(a.id, 'rejected')} className="hover:underline text-rose-700 dark:text-rose-300">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
