"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type OrderRow = {
  id: string;
  total_in_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function AccountOrdersPage() {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("orders")
          .select("id,total_in_cents,currency,status,created_at")
          .eq("customer_id", uid)
          .order("created_at", { ascending: false });
        if (!mounted) return;
        if (error) throw error;
        setOrders((data as OrderRow[]) || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  return (
    <div className="min-h-[60vh] p-6">
      <div className="mx-auto w-[min(96vw,960px)] space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Orders</h1>
          <p className="text-sm text-white/70">Track your recent purchases and order status.</p>
        </header>

        <section className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 text-white">
          {loading ? (
            <div className="text-white/80">Loading orders…</div>
          ) : error ? (
            <div className="text-sm text-rose-300">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-white/80">You haven’t placed any orders yet.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/70">
                    <th className="text-left py-2 pr-4">Order</th>
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-right py-2 pl-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-4 font-medium text-white">#{o.id.slice(0, 8)}</td>
                      <td className="py-2 pr-4 text-white/80">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 capitalize text-white/90">{o.status}</td>
                      <td className="py-2 pl-4 text-right text-white">{formatMoney(o.total_in_cents, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format((cents || 0) / 100);
  } catch {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  }
}
