import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/utils/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MarkFulfilledRequest = {
  order_id: string;
  tracking_number?: string;
  tracking_url?: string;
  label_url?: string;
  carrier?: string;
  service?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MarkFulfilledRequest;
    if (!body?.order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    const supa = getSupabaseServiceClient();

    // Load existing metadata
    const { data: existing, error: loadErr } = await supa
      .from("orders")
      .select("id, metadata")
      .eq("id", body.order_id)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    type ShipmentMeta = {
      at: string;
      tracking_number: string | null;
      tracking_url: string | null;
      label_url: string | null;
      carrier: string | null;
      service: string | null;
    };

    type MetadataWithShipments = Record<string, unknown> & { shipments?: ShipmentMeta[] };
    const meta = (existing.metadata || {}) as MetadataWithShipments;
    const shipments: ShipmentMeta[] = Array.isArray(meta.shipments) ? [...meta.shipments] : [];
    shipments.push({
      at: new Date().toISOString(),
      tracking_number: body.tracking_number || null,
      tracking_url: body.tracking_url || null,
      label_url: body.label_url || null,
      carrier: body.carrier || null,
      service: body.service || null,
    });

    const newMetadata: MetadataWithShipments = { ...meta, shipments };

    const { error: updErr } = await supa
      .from("orders")
      .update({ fulfillment_status: "fulfilled", metadata: newMetadata })
      .eq("id", body.order_id);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
