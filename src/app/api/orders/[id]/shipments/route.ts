import { NextResponse } from "next/server";
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
    const { data, error } = await supa
      .from("orders")
      .select("id, metadata, fulfillment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    type MaybeShipments = { shipments?: unknown } | null;
    const meta = (data.metadata as unknown) as MaybeShipments;
    const shipments: unknown[] = Array.isArray(meta?.shipments) ? meta!.shipments as unknown[] : [];

    return NextResponse.json({
      fulfillment_status: data.fulfillment_status,
      shipments,
      last: shipments.length ? shipments[shipments.length - 1] : null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
