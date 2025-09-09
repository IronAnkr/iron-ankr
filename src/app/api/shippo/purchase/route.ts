import { NextResponse } from "next/server";
import { getShippoConfig } from "@/utils/shippo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PurchaseRequest = {
  rate_id: string;
  label_file_type?: "PDF" | "PNG" | "ZPL";
  metadata?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PurchaseRequest;
    if (!body?.rate_id) return NextResponse.json({ error: "Missing rate_id" }, { status: 400 });
    const { token, baseUrl } = getShippoConfig();

    const res = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rate: body.rate_id,
        label_file_type: body.label_file_type || "PDF",
        async: false,
        metadata: body.metadata,
      }),
    });

    const data = await res.json();
    if (!res.ok || data?.status === "ERROR") {
      const message = data?.messages?.[0]?.text || data?.detail || data?.error || res.statusText;
      return NextResponse.json({ error: String(message) }, { status: res.status || 400 });
    }

    // Key fields: label_url, tracking_number, tracking_url_provider, rate (with provider + service)
    return NextResponse.json({ transaction: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

