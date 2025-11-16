import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/utils/supabase/service";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

type StartBody = {
  action: "start";
  page_url: string;
  path: string;
  search?: string;
  title?: string;
  referrer?: string;
  device_id?: string;
  fingerprint?: string;
  viewport?: { w: number; h: number };
  screen?: { w: number; h: number; d?: number };
  language?: string;
  timezone?: string;
};

type EndBody = {
  action: "end";
  id: string;
};

export async function POST(req: Request) {
  try {
    const h = req.headers;
    const ipHeader = h.get("x-forwarded-for") || h.get("x-real-ip") || "";
    const ip = ipHeader.split(",")[0]?.trim() || null;
    const userAgent = h.get("user-agent") || null;

    const service = getSupabaseServiceClient();
    const supabase = await createServerSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;

    const body = (await req.json().catch(() => null)) as StartBody | EndBody | null;
    if (!body || typeof body !== "object" || !("action" in body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (body.action === "start") {
      const b = body as StartBody;
      const insert = {
        user_id: userId,
        device_id: b.device_id ?? null,
        fingerprint: b.fingerprint ?? null,
        ip: ip,
        user_agent: userAgent,
        referrer: b.referrer ?? null,
        page_url: b.page_url ?? null,
        path: b.path ?? null,
        search: b.search ?? null,
        title: b.title ?? null,
        language: b.language ?? null,
        timezone: b.timezone ?? null,
        viewport: b.viewport ? JSON.stringify(b.viewport) : null,
        screen: b.screen ? JSON.stringify(b.screen) : null,
        // started_at defaults to now() in DB
      } as const;

      const { data, error } = await service
        .from("page_views")
        .insert(insert)
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    if (body.action === "end") {
      const b = body as EndBody;
      if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      const { error } = await service
        .from("page_views")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", b.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
