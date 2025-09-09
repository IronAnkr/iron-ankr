import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
  return url.startsWith("http") ? url : `https://${url}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const cartId: string | undefined = body?.cartId;
    if (!cartId) return NextResponse.json({ error: "Missing cartId" }, { status: 400 });

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const supabase = await createClient();
    const [{ data: cart, error: cartErr }, { data: items, error: itemsErr }] = await Promise.all([
      supabase.from("carts").select("id,total_in_cents,currency,subtotal_in_cents,discount_in_cents,tax_in_cents,shipping_in_cents").eq("id", cartId).maybeSingle(),
      supabase.from("cart_line_items").select("title,sku,quantity,unit_price_in_cents").eq("cart_id", cartId),
    ]);

    if (cartErr) throw cartErr;
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    if (itemsErr) throw itemsErr;
    const lineItems = (items ?? []).map((it) => ({
      price_data: {
        currency: cart.currency || "USD",
        product_data: { name: it.title, metadata: it.sku ? { sku: it.sku } : undefined },
        unit_amount: it.unit_price_in_cents,
      },
      quantity: it.quantity,
      adjustable_quantity: { enabled: false },
    } satisfies Stripe.Checkout.SessionCreateParams.LineItem));

    if (lineItems.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
    const site = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: cartId,
      metadata: { cart_id: cartId },
      success_url: `${site}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/cart?canceled=1`,
      line_items: lineItems,
      currency: cart.currency || "USD",
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
