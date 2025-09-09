import { NextResponse } from "next/server";
import { getShippoConfig, type ShippoAddress, type ShippoParcel } from "@/utils/shippo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RatesRequest = {
  to_address: ShippoAddress;
  from_address?: ShippoAddress; // falls back to defaults
  parcel: ShippoParcel;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RatesRequest;
    if (!body?.to_address || !body?.parcel) {
      return NextResponse.json({ error: "Missing to_address or parcel" }, { status: 400 });
    }
    const { token, baseUrl } = getShippoConfig();

    const shipmentPayload = {
      address_from: body.from_address,
      address_to: body.to_address,
      parcels: [body.parcel],
      async: false,
    };

    const res = await fetch(`${baseUrl}/shipments`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      const message = data?.detail || data?.error || res.statusText;
      return NextResponse.json({ error: String(message) }, { status: res.status });
    }

    // Returns shipment with rates array
    return NextResponse.json({ shipment: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

