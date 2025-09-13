import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/utils/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!sig || !secret || !key) return new NextResponse("Stripe not configured", { status: 500 });

  const payload = await req.text();
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown webhook error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const cartId = (session.client_reference_id || session.metadata?.cart_id) as string | undefined;
        if (!cartId) break;

        const supa = getSupabaseServiceClient();
        // Load cart and items
        const { data: cart } = await supa
          .from("carts")
          .select("id,customer_id,subtotal_in_cents,discount_in_cents,tax_in_cents,shipping_in_cents,total_in_cents,currency")
          .eq("id", cartId)
          .maybeSingle();
        if (!cart) break;

        const { data: items } = await supa
          .from("cart_line_items")
          .select("id,product_id,variant_id,title,sku,quantity,unit_price_in_cents,total_price_in_cents,metadata")
          .eq("cart_id", cartId);

        // Ensure we have a customer row
        let customerId = cart.customer_id as string | null;
        try {
          const cd = session.customer_details;
          const email = (cd?.email || (session.customer_email as string | null)) ?? null;
          if (!customerId && email) {
            const { data: existing } = await supa
              .from("customers")
              .select("id")
              .eq("email", email)
              .maybeSingle();
            if (existing?.id) {
              customerId = existing.id as string;
            } else {
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
              if (!custErr) customerId = newId;
            }
            // link cart if it was anonymous
            if (!cart.customer_id && customerId) {
              await supa.from("carts").update({ customer_id: customerId }).eq("id", cart.id);
            }
          }
        } catch { /* ignore customer creation errors */ }

        const orderId = crypto.randomUUID();
        const now = new Date().toISOString();
        // Create order
        const { error: orderErr } = await supa.from("orders").insert({
          id: orderId,
          cart_id: cart.id,
          customer_id: customerId,
          subtotal_in_cents: cart.subtotal_in_cents,
          discount_in_cents: cart.discount_in_cents,
          tax_in_cents: cart.tax_in_cents,
          shipping_in_cents: cart.shipping_in_cents,
          total_in_cents: cart.total_in_cents,
          currency: cart.currency,
          status: "paid",
          payment_status: "paid",
          fulfillment_status: "unfulfilled",
          placed_at: now,
          metadata: {
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
          },
        });
        if (orderErr) throw orderErr;

        // Map items into order_line_items
        const orderItems = (items || []).map((it) => ({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: it.product_id,
          variant_id: it.variant_id,
          title: it.title,
          sku: it.sku,
          quantity: it.quantity,
          unit_price_in_cents: it.unit_price_in_cents,
          total_price_in_cents: it.total_price_in_cents,
          metadata: it.metadata || null,
        }));
        if (orderItems.length) {
          const { error: liErr } = await supa.from("order_line_items").insert(orderItems);
          if (liErr) throw liErr;
        }

        // Optionally clear cart items to prevent re-use
        await supa.from("cart_line_items").delete().eq("cart_id", cartId);
        break;
      }
      default:
        // no-op
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown handler error";
    return new NextResponse(`Webhook handler failed: ${message}`, { status: 500 });
  }
}
