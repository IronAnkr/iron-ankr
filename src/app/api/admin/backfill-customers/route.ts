import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/utils/supabase/service";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Owner-only guard
    const supaServer = await createServerSupabase();
    const { data: auth } = await supaServer.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleRow } = await getSupabaseServiceClient()
      .from("app_users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if ((roleRow?.role || '').toLowerCase() !== 'owner') {
      return NextResponse.json({ error: "Forbidden: owner only" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") || 200)));
    const dryRun = (url.searchParams.get("dry") || "false").toLowerCase() === "true";

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const supa = getSupabaseServiceClient();

    const { data: orders, error } = await supa
      .from("orders")
      .select("id, cart_id, customer_id, metadata, created_at")
      .is("customer_id", null)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;

    const results: Array<Record<string, unknown>> = [];
    let linked = 0, created = 0, skipped = 0;

    for (const o of orders || []) {
      const meta = (o?.metadata || {}) as Record<string, unknown>;
      const sessionId = (meta["stripe_checkout_session_id"] as string | undefined) || null;
      if (!sessionId) {
        skipped++;
        results.push({ order_id: o.id, status: "skipped", reason: "no_session_id" });
        continue;
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const cd = session.customer_details;
        const email = cd?.email || (session.customer_email as string | null) || null;
        if (!email) {
          skipped++;
          results.push({ order_id: o.id, status: "skipped", reason: "no_email" });
          continue;
        }

        // Find or create customer
        let customerId: string | null = null;
        const { data: existing } = await supa
          .from("customers")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (existing?.id) {
          customerId = existing.id as string;
        } else if (!dryRun) {
          const name = cd?.name || "";
          const [first_name, ...rest] = name.split(" ");
          const last_name = rest.join(" ") || null;
          const newId = crypto.randomUUID();
          const { error: custErr } = await supa.from("customers").insert({
            id: newId,
            email,
            first_name: first_name || null,
            last_name,
            phone: cd?.phone || null,
            metadata: { stripe_customer_id: session.customer || null },
          });
          if (custErr) throw custErr;
          customerId = newId;
          created++;
        }

        if (customerId && !dryRun) {
          const { error: updOrderErr } = await supa
            .from("orders")
            .update({ customer_id: customerId })
            .eq("id", o.id);
          if (updOrderErr) throw updOrderErr;
          if (o.cart_id) {
            await supa.from("carts").update({ customer_id: customerId }).eq("id", o.cart_id);
          }
          linked++;
        }

        results.push({ order_id: o.id, status: dryRun ? "would_link" : "linked", customer_email: email });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        results.push({ order_id: o.id, status: "error", error: message });
      }
    }

    return NextResponse.json({
      scanned: (orders || []).length,
      linked,
      created,
      skipped,
      dryRun,
      results,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
