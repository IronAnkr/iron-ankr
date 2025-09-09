import { NextResponse } from "next/server";
import { getDefaultFromAddress } from "@/utils/shippo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const from = getDefaultFromAddress();
  return NextResponse.json({ from_address: from });
}

