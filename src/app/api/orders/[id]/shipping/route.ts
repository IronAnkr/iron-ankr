import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/utils/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = String(id || "");
    if (!orderId) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

    const supa = getSupabaseServiceClient();
    const { data: order, error } = await supa
      .from("orders")
      .select("id, metadata")
      .eq("id", orderId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const sessionId = order?.metadata?.["stripe_checkout_session_id"] as string | undefined;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!sessionId || !key) {
      return NextResponse.json({ to_address: null });
    }

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const customer = session.customer_details || undefined;
    const addr = customer?.address || undefined;

    const to_address = addr
      ? {
          name: customer?.name || undefined,
          company: undefined,
          street1: addr.line1 || "",
          street2: addr.line2 || undefined,
          city: addr.city || "",
          state: addr.state || "",
          zip: addr.postal_code || "",
          country: (addr.country as string) || "US",
          phone: customer?.phone || undefined,
          email: customer?.email || undefined,
        }
      : null;

    return NextResponse.json({ to_address });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
